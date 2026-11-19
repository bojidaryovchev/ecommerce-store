import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * One batch through Claude Code, headless: `claude -p "/<skill> <batch file>"`.
 *
 * WHY THE CLI AND NOT THE API. This runs on the owner's Claude subscription, as buy-a-coffee's catalogue
 * copywriter does: on the owner's machine the CLI uses its own sign-in, and on CI `claude setup-token` issues
 * a long-lived token that headless `claude -p` accepts as CLAUDE_CODE_OAUTH_TOKEN. The same command runs on an
 * ANTHROPIC_API_KEY when one is set (it takes precedence), so API billing is an environment change. The
 * Anthropic SDK path is kept separately (api.ts, `--engine api`).
 *
 * WHAT THE MODEL CAN REACH. Product text comes from a third-party shop and web pages are anyone's, so the
 * session is built as if the model might be talked into misbehaving:
 *
 *  - It runs in an empty temporary directory holding only the skill, the batch file and the batch's images.
 *    `--permission-mode dontAsk` with `--permission-prompts none` refuses anything not pre-approved, and only
 *    reading inside that directory (plus WebSearch/WebFetch for research) is.
 *  - Its environment is an allow-list (`childEnvironment`): no database URL, no other secret.
 *  - `--tools` gives it Read (and the web tools for research): no shell, no writes. `--strict-mcp-config`
 *    keeps out the machine's MCP servers, and `--setting-sources project` keeps out the user's own settings,
 *    hooks and plugins: only the workspace's skill is loaded.
 *  - It only returns JSON. This process validates it and is the one that writes to the database.
 */

export interface SessionRequest {
  /** The skill to run: its folder under .claude/skills in the workspace. */
  skill: "catalog-research" | "catalog-copy" | "catalog-review" | "catalog-faq" | "catalog-faq-review";
  /** The session's working directory: the batch's temporary workspace. */
  workspace: string;
  /** The batch file, relative to the workspace. */
  batchFile: string;
  /** The JSON Schema the answer must match. */
  schema: Record<string, unknown>;
  /** Allow WebSearch and WebFetch. */
  web: boolean;
  /** Images the session may look at, relative to the workspace (the API engine attaches them). */
  images: string[];
  maxTurns: number;
  timeoutMs: number;
}

export interface SessionResult {
  output: unknown;
  /** What the run would have cost on the API (informational on a subscription). */
  costUsd: number | null;
  turns: number | null;
  durationMs: number;
}

/** Runs one session. `runClaudeSession` (CLI) or `runApiSession` (Anthropic API). */
export type Engine = (request: SessionRequest) => Promise<SessionResult>;

/**
 * Why a session failed, which decides whose fault it is.
 *
 * `setup` (the CLI could not start, is not signed in, or the account cannot be billed) and `service` (usage
 * limit, rate limiting, an overloaded or failing service, the network) say nothing about the products: the run
 * stops and the products are not charged an attempt, or an expired token would quietly give up on the whole
 * catalogue. `batch` (out of turns, no usable answer, too slow) is this batch's own, and counts against it.
 */
export type SessionFailure = "setup" | "service" | "batch";

export class SessionError extends Error {
  constructor(
    message: string,
    readonly detail: string,
    readonly failure: SessionFailure = "batch",
  ) {
    super(message);
    this.name = "SessionError";
  }
}

/* Matched against what the CLI itself prints, not any number on a page the model fetched. */
const SETUP_TROUBLE = [
  /not logged in/i,
  /please run \/login/i,
  /invalid api key/i,
  /invalid bearer token/i,
  /oauth token (?:has )?expired/i,
  /authentication_error/i,
  /API Error: 40[13]\b/,
  /credit balance is too low/i,
];
const SERVICE_TROUBLE = [
  /usage limit/i,
  /hit your limit/i,
  /rate[_ ]limit/i,
  /too many requests/i,
  /overloaded/i,
  /API Error: (?:429|5\d\d)\b/,
  /connection error/i,
  /\b(?:ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN)\b/,
  /fetch failed/i,
];

export function classifyFailure(text: string): SessionFailure {
  if (SERVICE_TROUBLE.some((pattern) => pattern.test(text))) return "service";
  if (SETUP_TROUBLE.some((pattern) => pattern.test(text))) return "setup";
  return "batch";
}

/**
 * What the CLI needs from the environment, and nothing else: where it lives and keeps its sign-in, temp
 * space, locale, proxies, and the credential it runs on. Everything else this process holds (the database URL
 * above all) stays out of the model's reach. CLAUDECODE and friends stay out too, so a run started from inside
 * a Claude Code session is not taken for a nested one.
 */
const PASSED_THROUGH = new Set([
  "PATH",
  "PATHEXT",
  "HOME",
  "USERPROFILE",
  "APPDATA",
  "LOCALAPPDATA",
  "HOMEDRIVE",
  "HOMEPATH",
  "SYSTEMROOT",
  "SYSTEMDRIVE",
  "WINDIR",
  "COMSPEC",
  "TEMP",
  "TMP",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "TZ",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "NODE_EXTRA_CA_CERTS",
  "CLAUDE_CONFIG_DIR",
  "CLAUDE_CODE_OAUTH_TOKEN",
  "ANTHROPIC_API_KEY",
]);

/** A token copied out of a wrapped terminal line picks up line breaks; credentials never contain whitespace. */
const CREDENTIALS = new Set(["CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_API_KEY"]);

export function childEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const passed: NodeJS.ProcessEnv = {};
  for (const [name, raw] of Object.entries(env)) {
    const key = name.toUpperCase();
    const value = raw !== undefined && CREDENTIALS.has(key) ? raw.replace(/\s+/g, "") : raw;
    // Windows spells some of these in mixed case ("Path", "SystemRoot").
    if (value !== undefined && value !== "" && PASSED_THROUGH.has(key)) passed[name] = value;
  }
  return passed;
}

export interface CliOptions {
  /** The executable: `claude` on CI, the native `claude.exe` on Windows (see `claudeBin`). */
  bin: string;
  model: string;
  /** --effort; the CLI's default when unset. */
  effort?: string;
  /** The child's whole environment; see `childEnvironment`. */
  env: NodeJS.ProcessEnv;
}

/** Arguments for one session. Exported so tests can pin them without spawning. */
export function claudeArgs(request: SessionRequest, options: Pick<CliOptions, "model" | "effort">): string[] {
  const tools = request.web ? "Read,WebSearch,WebFetch" : "Read";
  const allowed = request.web ? "Read(./**),WebSearch,WebFetch" : "Read(./**)";
  return [
    "-p",
    `/${request.skill} ${request.batchFile}`,
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(request.schema),
    "--tools",
    tools,
    "--allowedTools",
    allowed,
    "--permission-mode",
    "dontAsk",
    "--permission-prompts",
    "none",
    "--strict-mcp-config",
    "--setting-sources",
    "project",
    "--no-session-persistence",
    "--max-turns",
    String(request.maxTurns),
    "--model",
    options.model,
    ...(options.effort ? ["--effort", options.effort] : []),
  ];
}

/** Read the CLI's `--output-format json` envelope. */
export function parseClaudeEnvelope(stdout: string): { output: unknown; costUsd: number | null; turns: number | null } {
  let envelope: Record<string, unknown>;
  try {
    envelope = JSON.parse(stdout.trim()) as Record<string, unknown>;
  } catch {
    const said = stdout.slice(-2000);
    throw new SessionError("Claude returned no JSON", said, classifyFailure(said));
  }
  if (envelope.is_error === true || (envelope.subtype && envelope.subtype !== "success")) {
    const said = String(envelope.result ?? "").slice(0, 2000);
    const kind = envelope.subtype && envelope.subtype !== "success" ? ` (${String(envelope.subtype)})` : "";
    throw new SessionError(
      `Claude run failed${kind}: ${said.split("\n")[0]?.slice(0, 200) || "no message"}`,
      said,
      // Out of turns is this batch's doing, whatever the last message said.
      envelope.subtype === "error_max_turns" ? "batch" : classifyFailure(said),
    );
  }
  if (envelope.structured_output === undefined || envelope.structured_output === null) {
    throw new SessionError("Claude returned no structured output", String(envelope.result ?? "").slice(0, 2000));
  }
  return {
    output: envelope.structured_output,
    costUsd: typeof envelope.total_cost_usd === "number" ? envelope.total_cost_usd : null,
    turns: typeof envelope.num_turns === "number" ? envelope.num_turns : null,
  };
}

/** Grace between asking a timed-out CLI to stop and killing it. */
const KILL_GRACE_MS = 5000;

export function runClaudeSession(request: SessionRequest, options: CliOptions): Promise<SessionResult> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(options.bin, claudeArgs(request, options), {
      cwd: request.workspace,
      env: options.env,
      // No shell: the JSON Schema is one argument and must reach the CLI intact.
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;
    let killer: ReturnType<typeof setTimeout> | undefined;
    const settle = (outcome: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killer);
      outcome();
    };

    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      // A CLI that ignores the request is killed, and the batch is settled either way.
      killer = setTimeout(() => {
        child.kill("SIGKILL");
        settle(() =>
          reject(
            new SessionError(`Claude run timed out after ${request.timeoutMs} ms and was killed`, stderr.slice(-2000)),
          ),
        );
      }, KILL_GRACE_MS);
    }, request.timeoutMs);

    child.on("error", (error) => {
      settle(() => reject(new SessionError(`Could not start Claude (${options.bin}): ${error.message}`, "", "setup")));
    });
    child.on("close", (code) => {
      settle(() => {
        if (timedOut) {
          reject(new SessionError(`Claude run timed out after ${request.timeoutMs} ms`, stderr.slice(-2000)));
          return;
        }
        if (code !== 0 && !stdout.trim()) {
          const said = stderr.slice(-2000);
          reject(new SessionError(`Claude exited with code ${code}`, said, classifyFailure(said)));
          return;
        }
        try {
          resolve({ ...parseClaudeEnvelope(stdout), durationMs: Date.now() - started });
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}

/**
 * The `claude` executable. On CI it is on the PATH. On Windows the npm install puts shell shims on the PATH
 * (`claude`, `claude.cmd`) that cannot be started without a shell, and a shell would mangle the JSON Schema
 * argument, so the native binary behind them is started directly.
 */
export function claudeBin(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.CLAUDE_BIN?.trim();
  if (configured) return configured;
  if (process.platform === "win32" && env.APPDATA) {
    const native = path.join(env.APPDATA, "npm", "node_modules", "@anthropic-ai", "claude-code", "bin", "claude.exe");
    if (existsSync(native)) return native;
  }
  return "claude";
}

/** Strip anything shaped like a credential from text bound for a log (CI logs can be public). */
export function scrubForLog(text: string): string {
  return text
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .slice(0, 500);
}
