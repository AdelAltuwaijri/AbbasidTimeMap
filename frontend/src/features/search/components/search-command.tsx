"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { searchHistoricalEntities } from "../api/search-client";
import {
  MAX_SEARCH_QUERY_VISIBLE_CHARACTERS,
  MIN_SEARCH_QUERY_VISIBLE_CHARACTERS,
  prepareHistoricalSearchQuery,
} from "../search-query";
import type { SearchEntityType, SearchResult } from "../types";

export interface SearchCommandHandle {
  focus: () => void;
}

interface SearchCommandProps {
  onSelectResult: (result: SearchResult) => void;
  debounceMs?: number;
}

type SearchStatus = "idle" | "loading" | "ready" | "error";

const ENTITY_LABELS: Record<SearchEntityType, string> = {
  event: "حدث",
  person: "شخص",
  place: "مكان",
  state: "دولة",
};

export const SearchCommand = forwardRef<SearchCommandHandle, SearchCommandProps>(
  function SearchCommand({ debounceMs = 250, onSelectResult }, forwardedRef) {
    const inputRef = useRef<HTMLInputElement>(null);
    const requestControllerRef = useRef<AbortController | null>(null);
    const sequenceRef = useRef(0);
    const listboxId = useId();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [status, setStatus] = useState<SearchStatus>("idle");
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    useImperativeHandle(forwardedRef, () => ({
      focus: () => inputRef.current?.focus(),
    }), []);

    useEffect(() => {
      const preparedQuery = prepareHistoricalSearchQuery(query);
      const sequence = ++sequenceRef.current;

      if (preparedQuery.visibleCharacterCount < MIN_SEARCH_QUERY_VISIBLE_CHARACTERS) {
        setResults([]);
        setStatus("idle");
        setIsOpen(false);
        setValidationMessage(null);
        return;
      }
      if (preparedQuery.visibleCharacterCount > MAX_SEARCH_QUERY_VISIBLE_CHARACTERS) {
        setResults([]);
        setStatus("error");
        setIsOpen(true);
        setValidationMessage("يجب ألا يتجاوز البحث 100 حرف.");
        return;
      }

      const controller = new AbortController();
      requestControllerRef.current = controller;
      const timer = window.setTimeout(() => {
        if (controller.signal.aborted) return;
        setValidationMessage(null);
        setStatus("loading");
        setIsOpen(true);

        searchHistoricalEntities(preparedQuery.query, controller.signal)
          .then((response) => {
            if (controller.signal.aborted || sequence !== sequenceRef.current) return;
            setResults(response.results);
            setActiveIndex(-1);
            setStatus("ready");
            setIsOpen(true);
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted || sequence !== sequenceRef.current) return;
            if (error instanceof DOMException && error.name === "AbortError") return;
            setResults([]);
            setActiveIndex(-1);
            setStatus("error");
            setIsOpen(true);
          })
          .finally(() => {
            if (requestControllerRef.current === controller) {
              requestControllerRef.current = null;
            }
          });
      }, debounceMs);

      return () => {
        window.clearTimeout(timer);
        controller.abort();
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
        }
      };
    }, [debounceMs, query]);

    const chooseResult = (result: SearchResult) => {
      onSelectResult(result);
      setResults([]);
      setStatus("idle");
      setActiveIndex(-1);
      setIsOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        sequenceRef.current += 1;
        requestControllerRef.current?.abort();
        requestControllerRef.current = null;
        setActiveIndex(-1);
        setIsOpen(false);
        return;
      }
      if (results.length === 0 || !isOpen) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % results.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        chooseResult(results[activeIndex]);
      }
    };

    const activeOptionId = activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

    return (
      <form
        aria-label="البحث التاريخي"
        className="absolute left-1/2 top-4 z-10 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2"
        dir="rtl"
        onSubmit={(event) => {
          event.preventDefault();
          if (activeIndex >= 0 && results[activeIndex]) chooseResult(results[activeIndex]);
        }}
        role="search"
      >
        <label
          className="mb-1.5 inline-block rounded-lg border border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/95 px-2.5 py-1 text-xs font-medium text-[var(--gold-primary)] shadow-lg backdrop-blur"
          htmlFor={`${listboxId}-input`}
        >
          بحث تاريخي
        </label>
        <input
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-label="البحث في السجل التاريخي"
          autoComplete="off"
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/95 px-4 py-3 text-sm text-[var(--text-primary)] shadow-2xl outline-none backdrop-blur placeholder:text-[var(--text-muted)] focus:border-[var(--gold-primary)]"
          dir="rtl"
          id={`${listboxId}-input`}
          onChange={(event) => {
            setQuery(event.target.value);
            setResults([]);
            setActiveIndex(-1);
            setStatus("idle");
            setIsOpen(false);
          }}
          onFocus={() => {
            if (results.length > 0 || status === "error") setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="ابحث عن حدث أو شخص أو مكان أو دولة"
          ref={inputRef}
          role="combobox"
          type="search"
          value={query}
        />

        {isOpen && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/98 shadow-2xl backdrop-blur">
            {status === "loading" && (
              <p className="px-4 py-3 text-sm text-[var(--text-muted)]" role="status">
                جارٍ البحث…
              </p>
            )}
            {status === "error" && (
              <p className="px-4 py-3 text-sm text-amber-100" role="alert">
                {validationMessage ?? "تعذّر إجراء البحث. حاول مرة أخرى."}
              </p>
            )}
            {status === "ready" && results.length === 0 && (
              <p className="px-4 py-3 text-sm text-[var(--text-muted)]" role="status">
                لا توجد نتائج مطابقة.
              </p>
            )}
            {status === "ready" && results.length > 0 && (
              <ul
                aria-label="نتائج البحث التاريخي"
                className="max-h-80 overflow-y-auto p-1"
                id={listboxId}
                role="listbox"
              >
                {results.map((result, index) => (
                  <li
                    aria-selected={activeIndex === index}
                    className={`cursor-pointer rounded-xl px-3 py-2.5 outline-none ${activeIndex === index ? "bg-[var(--gold-primary)]/20" : "hover:bg-black/20"}`}
                    id={`${listboxId}-option-${index}`}
                    key={`${result.entity_type}-${result.id}`}
                    onClick={() => chooseResult(result)}
                    onMouseDown={(event) => event.preventDefault()}
                    role="option"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-[var(--text-primary)]">{result.title_ar}</span>
                      <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--gold-primary)]">
                        {ENTITY_LABELS[result.entity_type]}
                      </span>
                    </div>
                    {result.title_en && (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]" dir="ltr">
                        {result.title_en}
                      </p>
                    )}
                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      {result.subtitle_ar}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    );
  },
);
