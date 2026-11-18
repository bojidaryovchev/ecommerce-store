/**
 * The catalogue enrichment pipeline (docs/enrichment.md), against DATABASE_URL.
 *
 *   pnpm --filter @ecommerce/supplier-sync enrich                    # plan: what a run would do, nothing sent
 *   pnpm --filter @ecommerce/supplier-sync enrich --apply            # up to 40 products through the pipeline
 *   pnpm --filter @ecommerce/supplier-sync enrich --apply --limit 1000 --concurrency 3   # the backfill
 *   pnpm --filter @ecommerce/supplier-sync enrich --apply --slug a,b --force             # redo two products
 *   pnpm --filter @ecommerce/supplier-sync enrich --report           # counts per gate, flagged and failed
 *   pnpm --filter @ecommerce/supplier-sync enrich --rerun a,b        # mark products to be redone next run
 *   pnpm --filter @ecommerce/supplier-sync enrich --approve          # publish everything the reviewer passed
 *
 * Runs on the Claude subscription by default (`claude -p`, the machine's sign-in or CLAUDE_CODE_OAUTH_TOKEN);
 * `--engine api` uses ANTHROPIC_API_KEY instead. Exit codes: 0 done, 1 configuration (the CLI could not start
 * or sign in), 2 stopped early or some sessions failed (the next run picks up where this one stopped).
 */
import * as schema from "@ecommerce/database/schema";
import { config as loadEnv } from "dotenv";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import postgres from "postgres";
import { consoleLogger } from "../logger";
import { refreshProductMedia } from "../media";
import { runApiSession } from "./api";
import { childEnvironment, claudeBin, runClaudeSession } from "./claude";
import { approveAllReady } from "./publish";
import { enrichReport, formatReport } from "./report";
import { runEnrich, type Generate } from "./run";
import { requestRerun } from "./store";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../../.env"), quiet: true });
loadEnv({ quiet: true });

const EXIT = { ok: 0, setup: 1, partial: 2 } as const;

const { values } = parseArgs({
  options: {
    apply: { type: "boolean", default: false },
    limit: { type: "string", default: "40" },
    slug: { type: "string", multiple: true },
    stage: { type: "string", default: "all" },
    force: { type: "boolean", default: false },
    concurrency: { type: "string", default: "2" },
    model: { type: "string" },
    "copy-model": { type: "string" },
    "review-model": { type: "string" },
    effort: { type: "string" },
    engine: { type: "string", default: "cli" },
    report: { type: "boolean", default: false },
    "refresh-media": { type: "boolean", default: false },
    rerun: { type: "string", multiple: true },
    approve: { type: "boolean", default: false },
  },
});

const fail = (message: string): never => {
  console.error(message);
  process.exit(EXIT.setup);
};

const url = process.env.DATABASE_URL ?? fail("DATABASE_URL is not set");
const limit = Number(values.limit);
const concurrency = Number(values.concurrency);
if (!Number.isInteger(limit) || limit < 1) fail("--limit must be a positive whole number");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) fail("--concurrency must be 1–8");
if (!["all", "research", "copy"].includes(values.stage)) fail("--stage must be all, research or copy");
if (!["cli", "api"].includes(values.engine)) fail("--engine must be cli or api");
if (values.effort && !["low", "medium", "high", "xhigh", "max"].includes(values.effort)) {
  fail("--effort must be low, medium, high, xhigh or max");
}
const list = (input: string[] | undefined) =>
  (input ?? [])
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
const slugs = list(values.slug);
if (values.force && slugs.length === 0) fail("--force needs --slug");

/**
 * Asks the live site to refresh these products' pages (POST /api/revalidate), when SITE_URL and
 * SUPPLIER_SYNC_SECRET are set; otherwise they refresh on the next deploy or catalogue sync.
 */
async function revalidate(productIds: string[]): Promise<void> {
  const site = process.env.SITE_URL?.replace(/\/+$/, "");
  const secret = process.env.SUPPLIER_SYNC_SECRET;
  if (productIds.length === 0 || !site || !secret) return;
  const response = await fetch(`${site}/api/revalidate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ productIds }),
  }).catch((error: unknown) => ({ ok: false, status: String(error) }) as const);
  console.log(response.ok ? "The site refreshed those pages." : `The site did not refresh (${response.status}).`);
}

/** The repository root, where .claude/skills lives. */
function repositoryRoot(from: string): string {
  let dir = path.resolve(from);
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(from);
    dir = parent;
  }
}

const client = postgres(url, { max: 4 });
const db = drizzle(client, { schema });
let exitCode: number = EXIT.ok;

try {
  const rerun = list(values.rerun);
  if (rerun.length > 0) {
    const rows = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(inArray(schema.products.slug, rerun));
    await requestRerun(
      db,
      rows.map((row) => row.id),
      new Date(),
    );
    console.log(`${rows.length} product(s) will be redone on the next run.`);
  } else if (values.report) {
    console.log(formatReport(await enrichReport(db)));
  } else if (values.approve) {
    // What an admin's "Approve all ready" does: publishes every proposal that passed the gates and the reviewer.
    const approved = await approveAllReady(db, null);
    console.log(`Published ${approved.length} product(s).`);
    await revalidate(approved);
  } else if (values["refresh-media"]) {
    const changed = await refreshProductMedia(db);
    console.log(`Photos, chips and drawings changed for ${changed.length} product(s).`);
    await revalidate(changed);
  } else {
    const skillsDir = path.join(repositoryRoot(process.cwd()), ".claude", "skills");
    if (values.apply && !existsSync(path.join(skillsDir, "catalog-research", "SKILL.md"))) {
      fail(`The skills are missing (${skillsDir})`);
    }
    const researchModel = values.model ?? process.env.ENRICH_RESEARCH_MODEL ?? "claude-opus-5-5";
    const copyModel = values["copy-model"] ?? process.env.ENRICH_COPY_MODEL ?? "claude-opus-5-5";
    const reviewModel = values["review-model"] ?? process.env.ENRICH_REVIEW_MODEL ?? copyModel;
    const effort = values.effort ?? process.env.ENRICH_EFFORT;
    const bin = claudeBin();
    // The model's process sees none of this process's secrets (the database URL above all).
    const env = childEnvironment(process.env);
    const generate: Generate =
      values.engine === "api"
        ? (request, model) => runApiSession(request, { model, ...(effort ? { effort } : {}) })
        : (request, model) => runClaudeSession(request, { bin, model, env, ...(effort ? { effort } : {}) });

    const result = await runEnrich({
      db,
      logger: consoleLogger,
      apply: values.apply,
      limit,
      ...(slugs.length > 0 ? { slugs } : {}),
      stages: values.stage as "all" | "research" | "copy",
      force: values.force,
      concurrency,
      researchModel,
      copyModel,
      reviewModel,
      generate,
      skillsDir,
      imageCacheDir: process.env.ENRICH_IMAGE_CACHE ?? path.join(homedir(), ".cache", "ecommerce-enrich", "images"),
    });

    console.log(
      JSON.stringify(
        {
          command: "enrich",
          engine: values.engine,
          researchModel,
          copyModel,
          ...result,
          planned: result.planned.length,
          plan: values.apply ? undefined : result.planned,
          note: result.applied
            ? `Researched ${result.researched}, flagged ${result.flagged}, wrote copy for ${result.copyWritten} (rejected ${result.copyRejected}); the reviewer passed ${result.reviewPassed}, sent back ${result.reviewRevised}, held ${result.reviewHeld}; ${result.pendingApproval} newly waiting for approval.`
            : `Plan only; nothing was sent or written. --apply would work on ${result.planned.length} product(s).`,
        },
        null,
        2,
      ),
    );
    if (values.apply) {
      console.log(`\n${formatReport(await enrichReport(db))}`);
      await revalidate(result.mediaChanged);
    }
    if (result.stopped?.startsWith("setup")) exitCode = EXIT.setup;
    else if (result.stopped !== null || result.failedSessions > 0) exitCode = EXIT.partial;
  }
} finally {
  await client.end();
}
process.exit(exitCode);
