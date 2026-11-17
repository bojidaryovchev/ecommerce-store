"use client";

import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Updates the catalog URL (filters live in the query string) without scrolling to the top.
 * Any change resets to the first page.
 */
export function useCatalogNavigation(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      mutate(params);
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
      });
    },
    [basePath, router, searchParams],
  );

  /** Adds or removes one value of a repeatable parameter (brand, f.<attribute>). */
  const toggle = useCallback(
    (key: string, value: string, checked: boolean) =>
      update((params) => {
        const values = params.getAll(key).filter((v) => v !== value);
        if (checked) values.push(value);
        params.delete(key);
        for (const v of values) params.append(key, v);
      }),
    [update],
  );

  /** Sets (or with an empty value, removes) a single parameter. */
  const set = useCallback(
    (key: string, value: string | null) =>
      update((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      }),
    [update],
  );

  /** Keeps only the search text (and the sort order). */
  const clear = useCallback(
    () =>
      update((params) => {
        for (const key of [...params.keys()]) {
          if (key !== "q" && key !== "sort") params.delete(key);
        }
      }),
    [update],
  );

  return { update, toggle, set, clear, isPending };
}
