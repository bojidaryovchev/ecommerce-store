import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";
import { SessionError, type SessionRequest, type SessionResult } from "./claude";
import { copyOutputSchema, researchOutputSchema } from "./contract";

/**
 * The same sessions on the Anthropic API instead of the subscription (`--engine api`): billed per token, for
 * when no Claude Code sign-in is available. The skill becomes the system prompt; the batch file and its images
 * go in the user message; research gets the server-side web search and fetch tools. The answer is held to the
 * same schema as the CLI's.
 */

const PAUSE_LIMIT = 6;

const SCHEMAS: Record<SessionRequest["skill"], z.ZodType> = {
  "catalog-research": researchOutputSchema,
  "catalog-copy": copyOutputSchema,
};

/** The skill's instructions without their frontmatter, adjusted for a session without a file system. */
async function systemPrompt(request: SessionRequest): Promise<string> {
  const skill = await readFile(path.join(request.workspace, ".claude", "skills", request.skill, "SKILL.md"), "utf8");
  const body = skill.replace(/^---[\s\S]*?\n---\n/, "").replaceAll("$ARGUMENTS", request.batchFile);
  return `${body}\n\n## In this session\n\nThere is no file system: the batch file \`${request.batchFile}\` and its images are attached to the user message. Where these instructions say to read a file, use the attached copy; each image follows a line naming its file.`;
}

export function runApiSession(
  request: SessionRequest,
  options: { client?: Anthropic; model: string; effort?: string },
): Promise<SessionResult> {
  return run(request, options).catch((error: unknown) => {
    if (error instanceof SessionError) throw error;
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      throw new SessionError(`API sign-in failed: ${error.message}`, "", "setup");
    }
    if (
      error instanceof Anthropic.RateLimitError ||
      error instanceof Anthropic.InternalServerError ||
      error instanceof Anthropic.APIConnectionError
    ) {
      throw new SessionError(`API unavailable: ${error.message}`, "", "service");
    }
    if (error instanceof Anthropic.APIError) {
      throw new SessionError(`API error ${error.status}: ${error.message}`, "", "batch");
    }
    throw new SessionError(error instanceof Error ? error.message : String(error), "", "batch");
  });
}

async function run(
  request: SessionRequest,
  options: { client?: Anthropic; model: string; effort?: string },
): Promise<SessionResult> {
  const client = options.client ?? new Anthropic();
  const started = Date.now();
  const batch = await readFile(path.join(request.workspace, request.batchFile), "utf8");
  const content: Anthropic.Beta.BetaContentBlockParam[] = [{ type: "text", text: `${request.batchFile}:\n${batch}` }];
  for (const file of request.images) {
    const data = (await readFile(path.join(request.workspace, file))).toString("base64");
    content.push({ type: "text", text: file });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content }];
  const tools: Anthropic.Beta.BetaToolUnion[] = request.web
    ? [
        { type: "web_search_20260209", name: "web_search", max_uses: 20 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 20 },
      ]
    : [];
  const system = await systemPrompt(request);
  const effort = (options.effort ?? "high") as "low" | "medium" | "high" | "xhigh" | "max";

  let costTurns = 0;
  for (let attempt = 0; attempt <= PAUSE_LIMIT; attempt++) {
    const response = await client.beta.messages.parse(
      {
        model: options.model,
        max_tokens: 32000,
        // If a safety classifier declines, the API retries on a fallback model it picks by category.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort, format: betaZodOutputFormat(SCHEMAS[request.skill]) },
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages,
        ...(tools.length > 0 ? { tools } : {}),
      },
      { timeout: request.timeoutMs },
    );
    costTurns += 1;
    if (response.stop_reason === "pause_turn") {
      // The server's tool loop paused: send its work back and it resumes where it stopped.
      messages.splice(1, messages.length - 1, { role: "assistant", content: response.content });
      continue;
    }
    if (response.stop_reason === "refusal") throw new SessionError("The model declined the batch", "", "batch");
    if (response.stop_reason === "max_tokens")
      throw new SessionError("The answer was cut off at max_tokens", "", "batch");
    if (!response.parsed_output) throw new SessionError("The API returned no structured output", "", "batch");
    return { output: response.parsed_output, costUsd: null, turns: costTurns, durationMs: Date.now() - started };
  }
  throw new SessionError(`The session paused more than ${PAUSE_LIMIT} times`, "", "batch");
}
