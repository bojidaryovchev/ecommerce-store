import { getSearchSuggestions } from "@/queries/products/get-search-suggestions.query";
import type { NextRequest } from "next/server";

/** Below this, a term matches half the catalog; above it, it is not a search. */
const MIN_TERM = 2;
const MAX_TERM = 80;

/** GET /api/search/suggest?q=… — what the header search offers while the visitor types. */
export async function GET(request: NextRequest) {
  const term = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_TERM);
  if (term.length < MIN_TERM) {
    return Response.json({ term, products: [], categories: [], brands: [], total: 0 });
  }
  const suggestions = await getSearchSuggestions(term);
  return Response.json(suggestions, {
    // Short-lived at the edge: the catalog changes daily, a typed word changes every keystroke.
    headers: { "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
}
