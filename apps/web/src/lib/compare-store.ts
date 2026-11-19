"use client";

import { useSyncExternalStore } from "react";
import { COMPARE_LIMIT } from "./compare-limit";

/**
 * The products a visitor picked to compare, kept in their browser (functional storage for a feature they asked
 * for, so no consent is needed). At most COMPARE_LIMIT of them. Shared across tabs.
 */

export type CompareItem = { id: string; slug: string; name: string; image: string | null };

const KEY = "compare-products";
const listeners = new Set<() => void>();
const EMPTY: CompareItem[] = [];
let cache: { raw: string | null; items: CompareItem[] } = { raw: null, items: EMPTY };

function read(): CompareItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.items;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const items = Array.isArray(parsed)
      ? parsed
          .filter((item): item is CompareItem => typeof item?.id === "string" && typeof item?.slug === "string")
          .slice(0, COMPARE_LIMIT)
      : EMPTY;
    cache = { raw, items };
    return items;
  } catch {
    return EMPTY;
  }
}

function write(items: CompareItem[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage blocked (private mode): the list lives only until the page reloads.
    cache = { raw: null, items };
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const compareStore = {
  toggle(item: CompareItem): "added" | "removed" | "full" {
    const items = read();
    if (items.some((entry) => entry.id === item.id)) {
      write(items.filter((entry) => entry.id !== item.id));
      return "removed";
    }
    if (items.length >= COMPARE_LIMIT) return "full";
    write([...items, item]);
    return "added";
  },
  remove(id: string): void {
    write(read().filter((entry) => entry.id !== id));
  },
  clear(): void {
    write([]);
  },
};

/** The current list; empty on the server and before hydration. */
export function useCompareList(): CompareItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
