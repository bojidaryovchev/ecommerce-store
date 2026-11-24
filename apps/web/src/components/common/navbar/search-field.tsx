"use client";

import { priceFormat } from "@/i18n/format";
import { getPathname, useRouter } from "@/i18n/navigation";
import { productHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { SearchSuggestions } from "@/queries/products/get-search-suggestions.query";
import { ArrowRight, Search } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Header search with suggestions, after the buy-a-coffee search field.
 *
 * The foundation is a real GET form: search works before hydration and without JavaScript, the
 * browser submits to /products?q=… on its own. Typing no longer re-filters the page under the
 * visitor; it offers products, categories and brands from /api/search/suggest, which matches with
 * the results page's own predicate. Enter runs the search; the arrow keys pick a suggestion.
 *
 * Requests are debounced, aborted when the term moves on (so a slow reply for "ар" cannot replace
 * the one for "артел") and cached for the session (backspacing should not re-ask).
 */

const DEBOUNCE_MS = 160;
const MIN_TERM = 2;
const MAX_TERM = 80;
const CACHE_LIMIT = 40;
const EMPTY: SearchSuggestions = { term: "", products: [], categories: [], brands: [], total: 0 };

type Props = {
  className?: string;
  /** Larger field for the mobile drawer and the hero. */
  size?: "default" | "large";
  autoFocus?: boolean;
  /** Called after the visitor picks a suggestion or searches (closes the mobile drawer). */
  onNavigate?: () => void;
};

const SearchField: React.FC<Props> = ({ className, size = "default", autoFocus, onNavigate }) => {
  const t = useTranslations("navigation.search");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [followedQuery, setFollowedQuery] = useState(urlQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>(EMPTY);
  const [open, setOpen] = useState(false);
  const cache = useRef(new Map<string, SearchSuggestions>());

  // Follow the URL (back button, a search from elsewhere), adjusting state while rendering rather
  // than in an effect that would render twice.
  if (urlQuery !== followedQuery) {
    setFollowedQuery(urlQuery);
    setValue(urlQuery);
    setOpen(false);
  }

  const term = value.trim().replace(/\s+/g, " ").slice(0, MAX_TERM);
  const searchable = term.length >= MIN_TERM;

  useEffect(() => {
    if (!open || !searchable) return;
    const controller = new AbortController();
    const cached = cache.current.get(term);
    // A cached term answers at once; a new one waits out the typing.
    const timer = setTimeout(
      async () => {
        if (cached) {
          setSuggestions(cached);
          return;
        }
        try {
          const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, {
            signal: controller.signal,
            headers: { accept: "application/json" },
          });
          if (!response.ok) return;
          const data = (await response.json()) as SearchSuggestions;
          if (data.term !== term) return;
          if (cache.current.size >= CACHE_LIMIT) cache.current.delete(cache.current.keys().next().value as string);
          cache.current.set(term, data);
          setSuggestions(data);
        } catch {
          // An aborted or failed lookup leaves the form fully usable.
        }
      },
      cached ? 0 : DEBOUNCE_MS,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, searchable, open]);

  const resultsHref = useCallback((query: string) => `/produkti?q=${encodeURIComponent(query)}`, []);

  /** Every row the arrow keys reach, in the order the panel draws them. */
  const options = useMemo<string[]>(() => {
    if (suggestions.term !== term) return [];
    const rows = [
      ...suggestions.products.map((product) => productHref(product)),
      ...suggestions.categories.map((category) => category.href),
      ...suggestions.brands.map((brand) => `/produkti?brand=${encodeURIComponent(brand.name)}`),
    ];
    if (suggestions.total > 0) rows.push(resultsHref(term));
    return rows;
  }, [suggestions, term, resultsHref]);

  /* The highlighted row belongs to one set of suggestions: a new set starts with none highlighted,
     without an effect to reset it. */
  const optionsKey = options.join("\n");
  const [active, setActive] = useState({ key: "", index: -1 });
  const activeIndex = active.key === optionsKey ? active.index : -1;
  const setActiveIndex = useCallback(
    (update: number | ((index: number) => number)) =>
      setActive((previous) => {
        const current = previous.key === optionsKey ? previous.index : -1;
        return { key: optionsKey, index: typeof update === "function" ? update(current) : update };
      }),
    [optionsKey],
  );

  const fresh = suggestions.term === term;
  const showEmpty = open && searchable && fresh && suggestions.total === 0;
  const expanded = open && searchable && options.length > 0;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, [setActiveIndex]);

  const goTo = useCallback(
    (href: string) => {
      close();
      onNavigate?.();
      router.push(href);
    },
    [close, onNavigate, router],
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goTo(term ? resultsHref(term) : "/produkti");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") return close();
    if (!expanded) {
      if (event.key === "ArrowDown" && searchable) setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      goTo(options[activeIndex]!);
    }
  };

  // Row numbers in the order the panel draws them, matching `options`.
  const categoryOffset = suggestions.products.length;
  const brandOffset = categoryOffset + suggestions.categories.length;
  const seeAllIndex = brandOffset + suggestions.brands.length;
  const large = size === "large";

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <form role="search" action={getPathname({ href: "/produkti", locale })} method="get" onSubmit={onSubmit}>
        <label htmlFor={inputId} className="sr-only">
          {t("label")}
        </label>
        <div
          className={cn(
            "bg-muted/60 focus-within:bg-background focus-within:border-ring focus-within:ring-ring/20 flex items-center rounded-full border border-transparent transition-colors focus-within:ring-4",
            large ? "h-12 pr-1.5 pl-4" : "h-10 pr-1 pl-3.5",
          )}
        >
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            id={inputId}
            name="q"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={expanded}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
            autoComplete="off"
            autoFocus={autoFocus}
            maxLength={MAX_TERM}
            value={value}
            placeholder={t("placeholder")}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className={cn(
              "placeholder:text-muted-foreground min-w-0 flex-1 self-stretch bg-transparent px-2.5 outline-none [&::-webkit-search-cancel-button]:hidden",
              large ? "text-base" : "text-sm",
            )}
          />
          <button
            type="submit"
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-colors",
              large ? "h-9 px-4 text-sm" : "h-8 px-3 text-xs",
            )}
          >
            {t("submit")}
          </button>
        </div>
      </form>

      <p role="status" className="sr-only">
        {expanded ? t("suggestionCount", { count: options.length, term }) : ""}
      </p>

      {(expanded || showEmpty) && (
        <div className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-50 mt-2 max-h-[70vh] overflow-y-auto overscroll-contain rounded-xl border p-1.5 shadow-xl">
          {showEmpty ? (
            <p className="text-muted-foreground px-3 py-4 text-sm">{t("noResults", { term })}</p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label={t("suggestions")}>
              {suggestions.products.length > 0 && <GroupLabel>{t("products")}</GroupLabel>}
              {suggestions.products.map((product, i) => {
                const href = productHref(product);
                return (
                  <SuggestionRow
                    key={product.id}
                    id={listboxId}
                    index={i}
                    activeIndex={activeIndex}
                    href={href}
                    onHover={setActiveIndex}
                    onSelect={goTo}
                  >
                    <span className="bg-muted relative size-11 shrink-0 overflow-hidden rounded-lg">
                      {product.image && (
                        <Image src={product.image} alt="" fill sizes="44px" className="object-contain p-1" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{product.name}</span>
                      {product.brand && (
                        <span className="text-muted-foreground block text-xs tracking-wide uppercase">
                          {product.brand}
                        </span>
                      )}
                    </span>
                    {product.price != null && (
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {format.number(product.price / 100, priceFormat(product.currency))}
                      </span>
                    )}
                  </SuggestionRow>
                );
              })}

              {suggestions.categories.length > 0 && <GroupLabel>{t("categories")}</GroupLabel>}
              {suggestions.categories.map((category, i) => (
                <SuggestionRow
                  key={category.id}
                  id={listboxId}
                  index={categoryOffset + i}
                  activeIndex={activeIndex}
                  href={category.href}
                  onHover={setActiveIndex}
                  onSelect={goTo}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{category.productCount}</span>
                </SuggestionRow>
              ))}

              {suggestions.brands.length > 0 && <GroupLabel>{t("brands")}</GroupLabel>}
              {suggestions.brands.map((brand, i) => (
                <SuggestionRow
                  key={brand.name}
                  id={listboxId}
                  index={brandOffset + i}
                  activeIndex={activeIndex}
                  href={`/produkti?brand=${encodeURIComponent(brand.name)}`}
                  onHover={setActiveIndex}
                  onSelect={goTo}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{brand.name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{brand.productCount}</span>
                </SuggestionRow>
              ))}

              {suggestions.total > 0 && (
                <SuggestionRow
                  id={listboxId}
                  index={seeAllIndex}
                  activeIndex={activeIndex}
                  href={resultsHref(term)}
                  onHover={setActiveIndex}
                  onSelect={goTo}
                  className="mt-1 border-t pt-2.5"
                >
                  <span className="text-primary flex-1 text-sm font-semibold">
                    {t("seeAll", { count: suggestions.total })}
                  </span>
                  <ArrowRight className="text-primary size-4" aria-hidden />
                </SuggestionRow>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const GroupLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li
    role="presentation"
    className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-semibold tracking-wider uppercase"
  >
    {children}
  </li>
);

type RowProps = {
  id: string;
  index: number;
  activeIndex: number;
  href: string;
  onHover: (index: number) => void;
  onSelect: (href: string) => void;
  className?: string;
  children: React.ReactNode;
};

/**
 * One suggestion. `role="option"` sits on the anchor itself so the row keeps a real href (middle
 * click, open in a new tab) while focus stays in the input and `aria-activedescendant` moves.
 */
const SuggestionRow: React.FC<RowProps> = ({
  id,
  index,
  activeIndex,
  href,
  onHover,
  onSelect,
  className,
  children,
}) => {
  const active = index === activeIndex;
  const locale = useLocale();
  return (
    <li role="presentation">
      <a
        id={`${id}-${index}`}
        role="option"
        aria-selected={active}
        href={getPathname({ href, locale })}
        tabIndex={-1}
        onMouseEnter={() => onHover(index)}
        // mousedown would blur the input and close the panel before the click lands.
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onSelect(href);
        }}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
          active ? "bg-accent" : "hover:bg-accent/60",
          className,
        )}
      >
        {children}
      </a>
    </li>
  );
};

export { SearchField };
