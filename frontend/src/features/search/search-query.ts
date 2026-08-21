const ARABIC_MARKS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;
const INVISIBLE_FORMAT_CONTROLS = /[\u00ad\u061c\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;
const NON_VISIBLE_CHARACTER = new RegExp("[\\p{C}\\p{M}\\p{Z}]", "u");

export const MIN_SEARCH_QUERY_VISIBLE_CHARACTERS = 2;
export const MAX_SEARCH_QUERY_VISIBLE_CHARACTERS = 100;

interface PreparedHistoricalSearchQuery {
  query: string;
  normalizedQuery: string;
  visibleCharacterCount: number;
}

export function prepareHistoricalSearchQuery(value: string): PreparedHistoricalSearchQuery {
  const query = value.trim();
  const normalizedQuery = query
    .normalize("NFKC")
    .toLowerCase()
    .replace(INVISIBLE_FORMAT_CONTROLS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(ARABIC_MARKS, "")
    .replace(/\s+/g, " ")
    .trim();
  const visibleCharacterCount = Array.from(normalizedQuery).filter(
    (character) => !NON_VISIBLE_CHARACTER.test(character),
  ).length;

  return { query, normalizedQuery, visibleCharacterCount };
}
