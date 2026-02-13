"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useRef, useState, useTransition } from "react";

type SearchBarProps = {
  className?: string;
};

const DEBOUNCE_MS = 300;

const SearchBar: React.FC<SearchBarProps> = ({ className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const isOnProducts = pathname === "/products";
  const urlQuery = isOnProducts ? (searchParams.get("q") ?? "") : "";

  const [query, setQuery] = useState(urlQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync local state with URL when user is not actively typing
  if (query !== urlQuery && !isFocused) {
    setQuery(urlQuery);
  }

  const navigate = useCallback(
    (searchTerm: string) => {
      const trimmed = searchTerm.trim();

      startTransition(() => {
        if (trimmed.length > 0) {
          router.push(`/products?q=${encodeURIComponent(trimmed)}`);
        } else if (isOnProducts) {
          router.push("/products");
        }
      });
    },
    [router, isOnProducts],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        navigate(value);
      }, DEBOUNCE_MS);
    },
    [navigate],
  );

  const handleSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      navigate(query);
      inputRef.current?.blur();
    },
    [query, navigate],
  );

  const handleClear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setQuery("");
    navigate("");
    inputRef.current?.focus();
  }, [navigate]);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="h-9 ps-8 pe-8 md:w-56 lg:w-72"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>
    </form>
  );
};

export { SearchBar };
