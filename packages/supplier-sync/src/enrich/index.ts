/**
 * The parts of the enrichment pipeline the web app uses: the admin's review and the report. The runner itself
 * (run.ts, claude.ts, api.ts, images.ts) stays out of this entry, so no CLI or image code reaches the web bundle.
 */
export { IMAGE_KINDS, type ImageKind } from "./contract";
export {
  ENERGY_CLASSES,
  KINDS,
  SPEC_FIELDS,
  formatSpecValue,
  isSpecKey,
  type ProductKind,
  type SpecField,
  type SpecKey,
} from "./fields";
export {
  readClassify,
  readExtract,
  readRewrite,
  readValidate,
  type ClassifyOutput,
  type ExtractOutput,
  type RewriteOutput,
  type ValidateOutput,
} from "./outputs";
export {
  EnrichmentReviewError,
  approveAllReady,
  approveEnrichment,
  rejectEnrichment,
  type ApproveRequest,
} from "./publish";
export { enrichReport, formatReport, type EnrichReport } from "./report";
export { STAGES, type Stage } from "./state";
export { requestRerun } from "./store";
