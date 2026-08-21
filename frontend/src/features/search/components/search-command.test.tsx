import { act, cleanup, createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchHistoricalEntities } from "../api/search-client";
import type { SearchResult } from "../types";
import { SearchCommand, type SearchCommandHandle } from "./search-command";

vi.mock("../api/search-client", () => ({ searchHistoricalEntities: vi.fn() }));

const BAGHDAD: SearchResult = {
  entity_type: "place",
  id: "place-1",
  slug: "baghdad",
  title_ar: "بغداد",
  title_en: "Baghdad",
  subtitle_ar: "مكان — تأسيس بغداد، 145هـ",
  relevant_hijri_year: 145,
  relevant_end_year: null,
  coordinates: { longitude: 44.3661, latitude: 33.3152 },
  bounds: null,
  confidence: null,
  navigation_event_id: "event-1",
  navigation_event_slug: "founding-of-baghdad",
};

const MANSUR: SearchResult = {
  ...BAGHDAD,
  entity_type: "person",
  id: "person-1",
  slug: "al-mansur",
  title_ar: "أبو جعفر المنصور",
  title_en: "Al-Mansur",
  subtitle_ar: "شخص — تأسيس بغداد، 145هـ",
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("SearchCommand", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("renders an Arabic RTL combobox and exposes loading and typed factual results", async () => {
    const request = deferred<{ query: string; results: SearchResult[] }>();
    vi.mocked(searchHistoricalEntities).mockReturnValue(request.promise);
    render(<SearchCommand debounceMs={0} onSelectResult={vi.fn()} />);

    const visibleLabel = screen.getByText("بحث تاريخي");
    expect(visibleLabel.tagName).toBe("LABEL");
    expect(visibleLabel).not.toHaveClass("sr-only");
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });
    expect(input).toHaveAttribute("dir", "rtl");
    fireEvent.change(input, { target: { value: "بغداد" } });

    expect(await screen.findByRole("status")).toHaveTextContent("جارٍ البحث");
    await act(async () => request.resolve({ query: "بغداد", results: [BAGHDAD] }));

    const option = await screen.findByRole("option", { name: /بغداد/ });
    expect(option).toHaveTextContent("مكان");
    expect(option).toHaveTextContent("مكان — تأسيس بغداد، 145هـ");
    expect(option).toHaveTextContent("Baghdad");
    expect(screen.getByRole("listbox", { name: "نتائج البحث التاريخي" })).toBeInTheDocument();
  });

  it("shows Arabic empty and isolated failure feedback", async () => {
    vi.mocked(searchHistoricalEntities)
      .mockResolvedValueOnce({ query: "غير موجود", results: [] })
      .mockRejectedValueOnce(new Error("offline"));
    render(<SearchCommand debounceMs={0} onSelectResult={vi.fn()} />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });

    fireEvent.change(input, { target: { value: "غير موجود" } });
    expect(await screen.findByText("لا توجد نتائج مطابقة.")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "بغداد" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("تعذّر إجراء البحث");
  });

  it("wraps Arrow navigation, selects with Enter, and retains input focus", async () => {
    const onSelectResult = vi.fn();
    vi.mocked(searchHistoricalEntities).mockResolvedValue({
      query: "العباسي",
      results: [BAGHDAD, MANSUR],
    });
    render(<SearchCommand debounceMs={0} onSelectResult={onSelectResult} />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });
    input.focus();
    fireEvent.change(input, { target: { value: "العباسي" } });
    await screen.findAllByRole("option");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-activedescendant", expect.stringContaining("option-0"));
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-activedescendant", expect.stringContaining("option-1"));
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelectResult).toHaveBeenCalledWith(MANSUR);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("dismisses results with Escape without selecting or changing the query", async () => {
    const onSelectResult = vi.fn();
    vi.mocked(searchHistoricalEntities).mockResolvedValue({ query: "بغداد", results: [BAGHDAD] });
    render(<SearchCommand debounceMs={0} onSelectResult={onSelectResult} />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });
    fireEvent.change(input, { target: { value: "بغداد" } });
    await screen.findByRole("option");

    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("بغداد");
    expect(onSelectResult).not.toHaveBeenCalled();
  });

  it("keeps results dismissed when an in-flight request resolves after Escape", async () => {
    const request = deferred<{ query: string; results: SearchResult[] }>();
    vi.mocked(searchHistoricalEntities).mockReturnValue(request.promise);
    render(<SearchCommand debounceMs={0} onSelectResult={vi.fn()} />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });

    fireEvent.change(input, { target: { value: "بغداد" } });
    await waitFor(() => expect(searchHistoricalEntities).toHaveBeenCalledTimes(1));
    const signal = vi.mocked(searchHistoricalEntities).mock.calls[0][1];
    fireEvent.keyDown(input, { key: "Escape" });

    expect(signal?.aborted).toBe(true);
    await act(async () => request.resolve({ query: "بغداد", results: [BAGHDAD] }));
    expect(screen.queryByRole("option", { name: /بغداد/ })).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("validates the 100-character limit using normalized visible characters", async () => {
    const query = "بَ".repeat(100);
    vi.mocked(searchHistoricalEntities).mockResolvedValue({ query, results: [] });
    render(<SearchCommand debounceMs={0} onSelectResult={vi.fn()} />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });

    fireEvent.change(input, { target: { value: query } });
    await waitFor(() => expect(searchHistoricalEntities).toHaveBeenCalledWith(
      query,
      expect.any(AbortSignal),
    ));

    fireEvent.change(input, { target: { value: "بَ".repeat(101) } });
    expect(await screen.findByRole("alert")).toHaveTextContent("100 حرف");
    expect(searchHistoricalEntities).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale response, aborts its signal, and suppresses one-character queries", async () => {
    const first = deferred<{ query: string; results: SearchResult[] }>();
    const second = deferred<{ query: string; results: SearchResult[] }>();
    vi.mocked(searchHistoricalEntities)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(<SearchCommand debounceMs={0} onSelectResult={vi.fn()} />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });

    fireEvent.change(input, { target: { value: "بغداد" } });
    await waitFor(() => expect(searchHistoricalEntities).toHaveBeenCalledTimes(1));
    const firstSignal = vi.mocked(searchHistoricalEntities).mock.calls[0][1];
    fireEvent.change(input, { target: { value: "المنصور" } });
    await waitFor(() => expect(searchHistoricalEntities).toHaveBeenCalledTimes(2));
    expect(firstSignal?.aborted).toBe(true);

    await act(async () => second.resolve({ query: "المنصور", results: [MANSUR] }));
    expect(await screen.findByRole("option", { name: /أبو جعفر المنصور/ })).toBeInTheDocument();
    await act(async () => first.resolve({ query: "بغداد", results: [BAGHDAD] }));
    expect(screen.queryByRole("option", { name: /^بغداد/ })).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "ا" } });
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(searchHistoricalEntities).toHaveBeenCalledTimes(2);
  });

  it("exposes imperative focus without submitting or selecting", () => {
    const reference = createRef<SearchCommandHandle>();
    render(<SearchCommand debounceMs={0} onSelectResult={vi.fn()} ref={reference} />);
    const input = screen.getByRole("combobox", { name: "البحث في السجل التاريخي" });
    const focusEvent = createEvent.focus(input);

    act(() => reference.current?.focus());

    expect(input).toHaveFocus();
    expect(focusEvent).toBeDefined();
    expect(searchHistoricalEntities).not.toHaveBeenCalled();
  });
});
