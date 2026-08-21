import { describe, expect, it } from "vitest";

import { prepareHistoricalSearchQuery } from "./search-query";

describe("prepareHistoricalSearchQuery", () => {
  it("matches the backend Arabic normalization policy without changing the submitted text", () => {
    const query = "  \u200fأَـلْإِمَام\u00a0ٱلْهَادِى\u200b  ";

    expect(prepareHistoricalSearchQuery(query)).toEqual({
      query: "\u200fأَـلْإِمَام\u00a0ٱلْهَادِى\u200b",
      normalizedQuery: "الامام الهادي",
      visibleCharacterCount: 12,
    });
  });

  it("counts Unicode base characters after NFKC while excluding marks and controls", () => {
    expect(prepareHistoricalSearchQuery("بَ".repeat(100)).visibleCharacterCount).toBe(100);
    expect(prepareHistoricalSearchQuery("بَ".repeat(101)).visibleCharacterCount).toBe(101);
    expect(prepareHistoricalSearchQuery("\ufea5َ\u200f").visibleCharacterCount).toBe(1);
  });
});
