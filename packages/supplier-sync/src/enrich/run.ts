import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Logger } from "../logger";
import { refreshProductMedia } from "../media";
import type { Database } from "../types";
import { SessionError, scrubForLog, type SessionRequest, type SessionResult } from "./claude";
import {
  COPY_OUTPUT_JSON_SCHEMA,
  RESEARCH_OUTPUT_JSON_SCHEMA,
  copyProductSchema,
  isWebAddress,
  parseAnswers,
  researchProductSchema,
  type CopyBatch,
  type CopyItem,
  type FieldBrief,
  type ResearchAnswer,
  type ResearchBatch,
  type ResearchItem,
} from "./contract";
import { buildCopyItem, checkCopyAnswer, figureSpellings } from "./copy";
import { KINDS, PRODUCT_KINDS, effectiveKind, fieldBrief, kindFields, type ProductKind } from "./fields";
import { guessImageKind, prepareImages } from "./images";
import {
  readClassify,
  readExtract,
  readRewrite,
  readValidate,
  type ClassifyOutput,
  type ExtractOutput,
  type ValidateOutput,
} from "./outputs";
import {
  STAGE_VERSIONS,
  extractInputsHash,
  familyKey,
  hashOf,
  loadEnrichState,
  type EnrichProduct,
  type EnrichState,
} from "./state";
import { markPending, proposalHash, saveImageKinds, saveStage, syncReviewFlag } from "./store";
import { validateResearch } from "./validate";

/**
 * `enrich`: the catalogue enrichment pipeline (see docs/enrichment.md).
 *
 * Plan by default: it reads the catalogue and prints what it would do. With `apply`, products go to the
 * model in batches (research, then copy), each answer passes the gates, and the results are stored per
 * product and stage. Nothing is published here: an admin approves on /admin/enrichment.
 *
 * A run is bounded (`limit` products), resumes where the last one stopped (stages whose inputs are unchanged
 * are skipped), and stops at once when the model service is unavailable (usage limit, sign-in), charging no
 * product for it.
 */

/** A stage that failed this many times running is left for a person. */
export const MAX_ATTEMPTS = 3;

export type Generate = (request: SessionRequest, model: string) => Promise<SessionResult>;

export interface EnrichOptions {
  db: Database;
  logger: Logger;
  apply: boolean;
  /** Products given to the model this run. */
  limit: number;
  slugs?: readonly string[];
  /** Only research (extract, validate, classify), only copy, or both. */
  stages: "all" | "research" | "copy";
  /** Redo the given products even where nothing changed (with `slugs`). */
  force?: boolean;
  /** Sessions at a time. */
  concurrency: number;
  researchModel: string;
  copyModel: string;
  generate: Generate;
  /** The repository's .claude/skills directory. */
  skillsDir: string;
  /** Where downloaded images are kept between runs. */
  imageCacheDir: string;
  /** Products per research session. */
  researchBatchSize?: number;
  /** Products per copy session. */
  copyBatchSize?: number;
  fetch?: typeof fetch;
  now?: () => Date;
}

export interface PlannedProduct {
  slug: string | null;
  name: string;
  research: boolean;
  copy: boolean;
}

export interface EnrichResult {
  applied: boolean;
  planned: PlannedProduct[];
  /** Wanted work but beyond this run's limit. */
  deferred: number;
  /** Left for a person after repeated failures. */
  givenUp: Array<{ slug: string | null; stage: string; error: string }>;
  sessions: number;
  failedSessions: number;
  researched: number;
  flagged: number;
  copyWritten: number;
  copyRejected: number;
  pendingApproval: number;
  /** Why the run stopped early, if it did. */
  stopped: string | null;
  costUsd: number;
  /** Products whose photos, chips or drawings changed: their pages need refreshing. */
  mediaChanged: string[];
}

interface Plan {
  research: EnrichProduct[];
  /** Products whose research is current but whose copy is not. */
  copyOnly: EnrichProduct[];
  /** Products whose stored research only needs validating again (the rules changed). */
  revalidate: EnrichProduct[];
  deferred: number;
  givenUp: EnrichResult["givenUp"];
}

const stale = (row: { inputsHash: string } | undefined, hash: string) => !row || row.inputsHash !== hash;
const retryable = (row: { status: string; attempts: number } | undefined) =>
  !row || row.status !== "failed" || row.attempts < MAX_ATTEMPTS;

function validateHash(product: EnrichProduct, extract: ExtractOutput, classify: ClassifyOutput | null): string {
  return hashOf({
    version: STAGE_VERSIONS.validate,
    extract,
    kind: effectiveKind(product.kind, classify?.kind, extract.kind),
    name: product.source.name,
    category: product.category?.slug ?? classify?.category?.slug ?? null,
    attributes: supplierAttributesOf(product),
  });
}

const supplierAttributesOf = (product: EnrichProduct) =>
  product.attributeValues
    .filter((value) => value.source === "supplier")
    .map(({ slug, name, unit, value, numericValue }) => ({ slug, name, unit, value, numericValue }));

/** The copy item, without what changes between attempts (siblings, retry notes): its hash is the rewrite's inputs. */
function copyInputsHash(item: CopyItem): string {
  return hashOf({ version: STAGE_VERSIONS.rewrite, item: { ...item, siblings: null, retry: null } });
}

export function planWork(
  state: EnrichState,
  options: Pick<EnrichOptions, "limit" | "slugs" | "stages" | "force">,
): Plan {
  const wanted = options.slugs?.length ? new Set(options.slugs) : null;
  const research: EnrichProduct[] = [];
  const copyOnly: EnrichProduct[] = [];
  const revalidate: EnrichProduct[] = [];
  const givenUp: Plan["givenUp"] = [];

  for (const product of state.products) {
    if (wanted && !(product.slug && wanted.has(product.slug))) continue;
    const forced = Boolean(options.force && wanted);
    const { extract, rewrite } = product.stages;
    const extractHash = extractInputsHash(product);

    const needsResearch = forced || stale(extract, extractHash) || extract?.status === "failed";
    if (needsResearch) {
      if (!forced && extract && !stale(extract, extractHash) && !retryable(extract)) {
        givenUp.push({ slug: product.slug, stage: "extract", error: extract.errors[0] ?? "failed" });
        continue;
      }
      if (options.stages !== "copy") research.push(product);
      continue;
    }

    const extracted = readExtract(extract?.output);
    if (!extracted) continue;
    const classified = readClassify(product.stages.classify?.output);
    if (stale(product.stages.validate, validateHash(product, extracted, classified))) {
      revalidate.push(product);
      continue;
    }
    if (options.stages === "research") continue;
    const context = copyContext(product, state);
    if (!context) continue;
    if (forced || stale(rewrite, copyInputsHash(context.item)) || rewrite?.status === "failed") {
      if (!forced && rewrite?.status === "failed" && !retryable(rewrite)) {
        givenUp.push({ slug: product.slug, stage: "rewrite", error: rewrite.errors[0] ?? "failed" });
        continue;
      }
      copyOnly.push(product);
    }
  }

  const total = research.length + copyOnly.length;
  const researchTaken = research.slice(0, options.limit);
  const copyTaken = copyOnly.slice(0, Math.max(0, options.limit - researchTaken.length));
  return {
    research: researchTaken,
    copyOnly: copyTaken,
    revalidate,
    deferred: total - researchTaken.length - copyTaken.length,
    givenUp,
  };
}

/**
 * Research batches: a family (products sharing the supplier's text) stays together and is researched once;
 * families of a kind and brand sit side by side. Batches that need web research take fewer families.
 */
export function researchBatches(products: readonly EnrichProduct[], maxProducts = 8): EnrichProduct[][] {
  const families = new Map<string, EnrichProduct[]>();
  for (const product of products) {
    const key = familyKey(product);
    families.set(key, [...(families.get(key) ?? []), product]);
  }
  const ordered = [...families.values()].sort((a, b) => {
    const ka = `${a[0]!.kind ?? "~"}|${a[0]!.brand ?? ""}|${a[0]!.source.name}`;
    const kb = `${b[0]!.kind ?? "~"}|${b[0]!.brand ?? ""}|${b[0]!.source.name}`;
    return ka.localeCompare(kb);
  });

  const batches: EnrichProduct[][] = [];
  let current: EnrichProduct[] = [];
  let familiesInCurrent = 0;
  let researchInCurrent = false;
  const flush = () => {
    if (current.length > 0) batches.push(current);
    current = [];
    familiesInCurrent = 0;
    researchInCurrent = false;
  };
  for (const family of ordered) {
    const research = family.some((product) => (product.kind ? KINDS[product.kind].research : true));
    const maxFamilies = research ? 2 : 4;
    for (let start = 0; start < family.length; start += maxProducts) {
      const chunk = family.slice(start, start + maxProducts);
      const fits =
        current.length + chunk.length <= maxProducts &&
        familiesInCurrent < (research || researchInCurrent ? 2 : maxFamilies);
      if (!fits) flush();
      current.push(...chunk);
      familiesInCurrent += 1;
      researchInCurrent ||= research;
    }
  }
  flush();
  return batches;
}

function chunk<T>(list: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < list.length; start += size) chunks.push(list.slice(start, start + size));
  return chunks;
}

const truncate = (text: string | null, max: number) =>
  text === null ? null : text.length > max ? `${text.slice(0, max)}…` : text;

/** A temporary workspace holding only the skill: what the model may read is what it is given. */
async function createWorkspace(skillsDir: string, skill: SessionRequest["skill"]): Promise<string> {
  const workspace = await mkdtemp(path.join(tmpdir(), `${skill}-`));
  const skillDir = path.join(workspace, ".claude", "skills", skill);
  await mkdir(skillDir, { recursive: true });
  await copyFile(path.join(skillsDir, skill, "SKILL.md"), path.join(skillDir, "SKILL.md"));
  return workspace;
}

export async function runEnrich(options: EnrichOptions): Promise<EnrichResult> {
  const now = options.now ?? (() => new Date());
  const log = options.logger;
  let state = await loadEnrichState(options.db);
  if (options.apply) {
    // Stored research whose validation is out of date (the rules changed): validate again, no model needed.
    const { revalidate } = planWork(state, { ...options, limit: Number.MAX_SAFE_INTEGER });
    for (const product of revalidate) await runValidation(options, product, state, now());
    if (revalidate.length > 0) state = await loadEnrichState(options.db);
  }
  const plan = planWork(state, options);

  const planned: PlannedProduct[] = [
    ...plan.research.map((p) => ({ slug: p.slug, name: p.name, research: true, copy: options.stages !== "research" })),
    ...plan.copyOnly.map((p) => ({ slug: p.slug, name: p.name, research: false, copy: true })),
  ];
  const result: EnrichResult = {
    applied: options.apply,
    planned,
    deferred: plan.deferred,
    givenUp: plan.givenUp,
    sessions: 0,
    failedSessions: 0,
    researched: 0,
    flagged: 0,
    copyWritten: 0,
    copyRejected: 0,
    pendingApproval: 0,
    stopped: null,
    costUsd: 0,
    mediaChanged: [],
  };
  if (!options.apply) return result;

  type Job = { kind: "research"; products: EnrichProduct[] } | { kind: "copy"; products: EnrichProduct[] };
  const queue: Job[] = [
    ...researchBatches(plan.research, options.researchBatchSize ?? 8).map((products) => ({
      kind: "research" as const,
      products,
    })),
    ...chunk(plan.copyOnly, options.copyBatchSize ?? 6).map((products) => ({ kind: "copy" as const, products })),
  ];

  const stop = (reason: string) => {
    result.stopped ??= reason;
  };

  const worker = async () => {
    while (queue.length > 0 && result.stopped === null) {
      const job = queue.shift()!;
      try {
        if (job.kind === "research") {
          const ready = await runResearchJob(options, job.products, state, result, now);
          if (options.stages !== "research" && ready.length > 0) {
            // Copy for what was just researched goes first: finished products sooner.
            queue.unshift(
              ...chunk(ready, options.copyBatchSize ?? 6).map((products) => ({ kind: "copy" as const, products })),
            );
          }
        } else {
          await runCopyJob(options, job.products, result, now);
        }
      } catch (error) {
        if (error instanceof SessionError && error.failure !== "batch") {
          stop(`${error.failure}: ${error.message}`);
          log.error("enrich.stopped", {
            failure: error.failure,
            message: error.message,
            detail: scrubForLog(error.detail),
          });
          return;
        }
        // Anything else is a bug or a database problem: stop rather than pile up failures.
        stop(error instanceof Error ? error.message : String(error));
        log.error("enrich.crashed", { message: error instanceof Error ? error.message : String(error) });
        return;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, options.concurrency) }, worker));
  // Image kinds are shared: one classified here may change the gallery of a product done long ago.
  result.mediaChanged = await refreshProductMedia(options.db);
  return result;
}

/* --- Research --------------------------------------------------------------------------------------------- */

async function runResearchJob(
  options: EnrichOptions,
  products: EnrichProduct[],
  state: EnrichState,
  result: EnrichResult,
  now: () => Date,
): Promise<EnrichProduct[]> {
  const started = now();
  const log = options.logger;
  const workspace = await createWorkspace(options.skillsDir, "catalog-research");
  try {
    // Images: the ones not classified before; spec tables and labels (their figures are needed again); and
    // photos (whether a photo shows this very model is a question about the product, not the picture).
    const urls = [...new Set(products.flatMap((product) => product.source.images))];
    const needsLook = urls.filter((url) => {
      const known = state.imageAssets.get(url);
      return !known || known.kind === "spec_table" || known.kind === "energy_label" || known.kind === "photo";
    });
    const prepared = await prepareImages(needsLook, {
      workspace,
      cacheDir: options.imageCacheDir,
      ...(options.fetch ? { fetch: options.fetch } : {}),
    });

    const anyUnknownKind = products.some((product) => product.kind === null);
    const kinds = new Set<ProductKind>(anyUnknownKind ? PRODUCT_KINDS : products.map((product) => product.kind!));
    const fieldsByKind: Partial<Record<ProductKind, FieldBrief[]>> = {};
    for (const kind of kinds) fieldsByKind[kind] = kindFields(kind).map(fieldBrief);

    const batch: ResearchBatch = {
      version: 1,
      fieldsByKind,
      categories: anyUnknownKind
        ? state.categories
            .filter((category) => category.kind !== null && !state.categories.some((c) => c.parentId === category.id))
            .map((category) => ({ slug: category.slug, name: category.name, kind: category.kind! }))
        : [],
      products: products.map((product): ResearchItem => {
        const research = product.kind ? KINDS[product.kind].research : true;
        return {
          id: product.id,
          name: product.source.name,
          brand: product.source.brand,
          sku: product.source.sku,
          category: product.category ? { slug: product.category.slug, name: product.category.name } : null,
          kind: product.kind,
          family: familyKey(product),
          supplierDescription: truncate(product.source.description, 8000),
          supplierAttributes: product.source.attributes.map((attribute) => ({
            name: attribute.name,
            value: attribute.values.join(", "),
          })),
          images: product.source.images.map((url) => {
            const known = state.imageAssets.get(url);
            const image = prepared.get(url);
            const width = image?.width ?? known?.width ?? null;
            const height = image?.height ?? known?.height ?? null;
            return {
              url,
              file: image?.file ?? null,
              size: width && height ? `${width}x${height}` : null,
              known: known ? { kind: known.kind, label: known.label } : null,
            };
          }),
          task: { research, chooseCategory: product.category === null },
        };
      }),
    };
    const batchFile = "batch.json";
    await writeFile(path.join(workspace, batchFile), JSON.stringify(batch, null, 2), "utf8");

    const families = new Set(batch.products.filter((p) => p.task.research).map((p) => p.family)).size;
    const images = [...prepared.values()].filter((image) => image.file !== null);
    const request: SessionRequest = {
      skill: "catalog-research",
      workspace,
      batchFile,
      schema: RESEARCH_OUTPUT_JSON_SCHEMA,
      web: families > 0,
      images: images.map((image) => image.file!),
      maxTurns: 12 + images.length + 12 * families + 2 * products.length,
      timeoutMs: Math.min(60, 10 + Math.ceil(images.length / 3) + 8 * families + 2 * products.length) * 60_000,
    };

    log.info("enrich.research.start", { products: products.map((p) => p.slug), images: images.length, families });
    let generated: SessionResult;
    try {
      generated = await options.generate(request, options.researchModel);
    } catch (error) {
      if (error instanceof SessionError && error.failure !== "batch") throw error;
      result.failedSessions += 1;
      const message = error instanceof Error ? error.message : String(error);
      log.warn("enrich.research.failed", {
        message,
        detail: error instanceof SessionError ? scrubForLog(error.detail) : "",
      });
      for (const product of products) {
        await saveStage(options.db, product.id, "extract", {
          status: "failed",
          inputsHash: extractInputsHash(product),
          output: null,
          errors: [`the research session failed: ${message}`],
          model: options.researchModel,
          startedAt: started,
          finishedAt: now(),
        });
      }
      return [];
    }
    result.sessions += 1;
    result.costUsd += generated.costUsd ?? 0;

    const parsed = parseAnswers(
      generated.output,
      researchProductSchema,
      products.map((product) => product.id),
    );
    if (parsed.stray.length > 0) log.warn("enrich.research.stray", { ids: parsed.stray });

    const ready: EnrichProduct[] = [];
    const finished = now();
    for (const product of products) {
      const answer = parsed.answers.get(product.id);
      if (!answer) {
        await saveStage(options.db, product.id, "extract", {
          status: "failed",
          inputsHash: extractInputsHash(product),
          output: null,
          errors: [parsed.invalid.get(product.id) ?? "no answer"],
          model: options.researchModel,
          startedAt: started,
          finishedAt: finished,
        });
        continue;
      }
      await storeResearch(options, product, answer, state, prepared, started, finished);
      await refreshProductMedia(options.db, [product.id]);
      result.researched += 1;
      const validated = await runValidation(options, product, await reload(options, product.id), finished);
      if (validated === "flagged") result.flagged += 1;
      ready.push(product);
    }
    log.info("enrich.research.done", {
      researched: ready.length,
      turns: generated.turns,
      seconds: Math.round(generated.durationMs / 1000),
    });
    return ready;
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

async function reload(options: EnrichOptions, productId: string): Promise<EnrichState> {
  return loadEnrichState(options.db, { productIds: [productId] });
}

async function storeResearch(
  options: EnrichOptions,
  product: EnrichProduct,
  answer: ResearchAnswer,
  state: EnrichState,
  prepared: Map<string, { width: number | null; height: number | null }>,
  started: Date,
  finished: Date,
): Promise<void> {
  const kind = effectiveKind(product.kind, answer.kind)!;
  const notes: string[] = [];
  if (product.kind && answer.kind !== product.kind) {
    notes.push(
      `The research took it for a ${KINDS[answer.kind].label.toLowerCase()}; its category says ${KINDS[product.kind].label.toLowerCase()}${kind === "accessory" ? ", so it is checked as a part" : ""}.`,
    );
  }
  const extract: ExtractOutput = {
    kind,
    identity: answer.identity,
    gtin: answer.gtin,
    mpn: answer.mpn,
    specs: answer.specs,
    features: answer.features.map((feature) => feature.trim()).filter(Boolean),
    sources: answer.sources.filter(isWebAddress),
    note: [answer.note.trim(), ...notes].filter(Boolean).join(" "),
  };
  await saveStage(options.db, product.id, "extract", {
    status: "succeeded",
    inputsHash: extractInputsHash(product),
    output: extract,
    errors: [],
    model: options.researchModel,
    startedAt: started,
    finishedAt: finished,
  });

  // Classify: the category (only for a product without one) and the images.
  const own = new Set(product.source.images);
  const problems: string[] = [];
  let category: ClassifyOutput["category"] = null;
  if (!product.category) {
    const chosen = answer.category && state.categories.find((c) => c.slug === answer.category!.slug);
    if (chosen) category = { slug: chosen.slug, name: chosen.name, reason: answer.category!.reason };
    else problems.push(answer.category ? `Unknown category “${answer.category.slug}”.` : "No category was chosen.");
  }
  const images = answer.images.filter((image) => own.has(image.url));
  const classified = new Set(images.map((image) => image.url));
  const heuristic = product.source.images
    .filter((url) => !classified.has(url) && !state.imageAssets.has(url))
    .flatMap((url) => {
      const size = prepared.get(url);
      const kind = guessImageKind(url, size?.width ?? null, size?.height ?? null);
      return kind ? [{ url, kind, label: null }] : [];
    });
  const classify: ClassifyOutput = { kind: answer.kind, category, images };
  await saveStage(options.db, product.id, "classify", {
    status: problems.length > 0 ? "flagged" : "succeeded",
    inputsHash: extractInputsHash(product),
    output: classify,
    errors: problems,
    model: options.researchModel,
    startedAt: started,
    finishedAt: finished,
  });
  await saveImageKinds(
    options.db,
    [
      ...images.map((image) => ({
        url: image.url,
        kind: image.kind,
        label: image.label,
        width: prepared.get(image.url)?.width ?? null,
        height: prepared.get(image.url)?.height ?? null,
        source: "model" as const,
        model: options.researchModel,
      })),
      ...heuristic.map((image) => ({
        ...image,
        width: prepared.get(image.url)?.width ?? null,
        height: prepared.get(image.url)?.height ?? null,
        source: "heuristic" as const,
        model: null,
      })),
    ],
    finished,
  );
}

/** The validation gate, in code. Returns the stored status. */
async function runValidation(
  options: EnrichOptions,
  product: EnrichProduct,
  state: EnrichState,
  now: Date,
): Promise<"succeeded" | "flagged" | null> {
  const current = state.products.find((p) => p.id === product.id) ?? product;
  const extract = readExtract(current.stages.extract?.output);
  if (!extract) return null;
  const classify = readClassify(current.stages.classify?.output);
  const kind = effectiveKind(current.kind, classify?.kind, extract.kind)!;
  const answer: ResearchAnswer = {
    id: current.id,
    kind,
    category: null,
    identity: extract.identity,
    gtin: extract.gtin,
    mpn: extract.mpn,
    specs: extract.specs as ResearchAnswer["specs"],
    features: extract.features,
    images: [],
    sources: extract.sources,
    note: extract.note,
  };
  const validation = validateResearch({
    name: current.source.name,
    kind,
    categorySlug: current.category?.slug ?? classify?.category?.slug ?? null,
    research: answer,
    supplierAttributes: supplierAttributesOf(current),
  });
  const classifyProblems = current.stages.classify?.status === "flagged" ? current.stages.classify.errors : [];
  const problems = [...validation.problems, ...classifyProblems];
  const status = problems.length > 0 ? "flagged" : "succeeded";
  await saveStage(options.db, current.id, "validate", {
    status,
    inputsHash: validateHash(current, extract, classify),
    output: validation,
    errors: validation.problems,
    model: null,
    startedAt: now,
    finishedAt: now,
  });
  await syncReviewFlag(options.db, current, problems, now);
  return status;
}

/* --- Copy ------------------------------------------------------------------------------------------------- */

function copyContext(product: EnrichProduct, state: EnrichState) {
  const extract = readExtract(product.stages.extract?.output);
  const validate: ValidateOutput | null = readValidate(product.stages.validate?.output);
  const classify = readClassify(product.stages.classify?.output);
  if (!extract || !validate) return null;
  const proposed = classify?.category ? state.categories.find((c) => c.slug === classify.category!.slug) : undefined;
  const sectionOf = (categoryId: string | undefined) => {
    let node = categoryId ? state.categories.find((c) => c.id === categoryId) : undefined;
    for (let depth = 0; node?.parentId && depth < 10; depth++) {
      const parentId: string = node.parentId;
      node = state.categories.find((c) => c.id === parentId);
    }
    return node?.slug ?? null;
  };
  const previous = product.stages.rewrite;
  const item = buildCopyItem({
    id: product.id,
    currentName: product.source.name,
    brand: product.brand ?? extract.identity.brand,
    model: extract.identity.model,
    kind: validate.kind,
    category: product.category?.name ?? proposed?.name ?? null,
    sectionSlug: product.section?.slug ?? sectionOf(proposed?.id),
    specs: validate.specs,
    omit: validate.omit,
    features: extract.features,
    supplierDescription: truncate(product.source.description, 8000),
    siblings: state.products
      .filter((other) => other.id !== product.id && familyKey(other) === familyKey(product))
      .map((other) => readRewrite(other.stages.rewrite?.output)?.name ?? other.source.name),
    retry: previous?.status === "failed" && previous.errors.length > 0 ? previous.errors : null,
  });
  const forbidden = validate.conflicts
    .filter((conflict) => conflict.resolution === "review" || validate.omit.includes(conflict.key))
    .flatMap((conflict) => [...figureSpellings(conflict.supplier), ...figureSpellings(conflict.found)]);
  return { item, forbidden };
}

async function runCopyJob(
  options: EnrichOptions,
  products: EnrichProduct[],
  result: EnrichResult,
  now: () => Date,
): Promise<void> {
  const started = now();
  const log = options.logger;
  const state = await loadEnrichState(options.db);
  const contexts = products
    .map((product) => state.products.find((p) => p.id === product.id))
    .filter((product): product is EnrichProduct => product !== undefined)
    .map((product) => ({ product, context: copyContext(product, state) }))
    .filter(
      (entry): entry is { product: EnrichProduct; context: NonNullable<ReturnType<typeof copyContext>> } =>
        entry.context !== null,
    );
  if (contexts.length === 0) return;

  const workspace = await createWorkspace(options.skillsDir, "catalog-copy");
  try {
    const batch: CopyBatch = { version: 1, products: contexts.map((entry) => entry.context.item) };
    const batchFile = "batch.json";
    await writeFile(path.join(workspace, batchFile), JSON.stringify(batch, null, 2), "utf8");
    const request: SessionRequest = {
      skill: "catalog-copy",
      workspace,
      batchFile,
      schema: COPY_OUTPUT_JSON_SCHEMA,
      web: false,
      images: [],
      maxTurns: 6 + contexts.length,
      timeoutMs: Math.min(30, 6 + 3 * contexts.length) * 60_000,
    };
    log.info("enrich.copy.start", { products: contexts.map((entry) => entry.product.slug) });
    let generated: SessionResult;
    try {
      generated = await options.generate(request, options.copyModel);
    } catch (error) {
      if (error instanceof SessionError && error.failure !== "batch") throw error;
      result.failedSessions += 1;
      const message = error instanceof Error ? error.message : String(error);
      log.warn("enrich.copy.failed", { message });
      for (const { context } of contexts) {
        await saveStage(options.db, context.item.id, "rewrite", {
          status: "failed",
          inputsHash: copyInputsHash(context.item),
          output: null,
          errors: [`the copy session failed: ${message}`],
          model: options.copyModel,
          startedAt: started,
          finishedAt: now(),
        });
      }
      return;
    }
    result.sessions += 1;
    result.costUsd += generated.costUsd ?? 0;

    const parsed = parseAnswers(
      generated.output,
      copyProductSchema,
      contexts.map((entry) => entry.context.item.id),
    );
    const finished = now();
    const names = new Set<string>();
    for (const { product, context } of contexts) {
      const answer = parsed.answers.get(context.item.id);
      const problems = answer
        ? checkCopyAnswer(answer, { item: context.item, forbiddenFigures: context.forbidden })
        : [parsed.invalid.get(context.item.id) ?? "no answer"];
      if (answer) {
        const key = answer.name.trim().toLowerCase();
        if (names.has(key)) problems.push("another product in the batch got the same name");
        names.add(key);
      }
      if (problems.length > 0) {
        result.copyRejected += 1;
        log.warn("enrich.copy.rejected", { slug: product.slug, problems });
        await saveStage(options.db, context.item.id, "rewrite", {
          status: "failed",
          inputsHash: copyInputsHash(context.item),
          output: null,
          errors: problems,
          model: options.copyModel,
          startedAt: started,
          finishedAt: finished,
        });
        continue;
      }
      await saveStage(options.db, context.item.id, "rewrite", {
        status: "succeeded",
        inputsHash: copyInputsHash(context.item),
        output: {
          name: answer!.name.trim(),
          metaDescription: answer!.metaDescription.replace(/\s+/g, " ").trim(),
          description: answer!.description
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim(),
        },
        errors: [],
        model: options.copyModel,
        startedAt: started,
        finishedAt: finished,
      });
      result.copyWritten += 1;
      const fresh = await loadEnrichState(options.db, { productIds: [product.id] });
      const stages = fresh.products[0]?.stages ?? {};
      if (await markPending(options.db, product.id, proposalHash(stages), finished)) result.pendingApproval += 1;
    }
    log.info("enrich.copy.done", { written: result.copyWritten, seconds: Math.round(generated.durationMs / 1000) });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
