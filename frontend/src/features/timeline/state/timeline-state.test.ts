import { describe, expect, it } from "vitest";

import { timelineReducer } from "./timeline-state";

describe("timelineReducer search navigation", () => {
  it("sets the shared Hijri year and stops playback atomically", () => {
    expect(
      timelineReducer(
        { selectedYear: 140, isPlaying: true },
        { type: "navigate", year: 145 },
      ),
    ).toEqual({ selectedYear: 145, isPlaying: false });
  });

  it("clamps search navigation to the interactive corpus", () => {
    expect(timelineReducer(
      { selectedYear: 145, isPlaying: true },
      { type: "navigate", year: 1 },
    )).toEqual({ selectedYear: 132, isPlaying: false });
    expect(timelineReducer(
      { selectedYear: 145, isPlaying: true },
      { type: "navigate", year: 999 },
    )).toEqual({ selectedYear: 170, isPlaying: false });
  });

  it("keeps the existing set-year playback behavior unchanged", () => {
    expect(timelineReducer(
      { selectedYear: 145, isPlaying: true },
      { type: "set-year", year: 146 },
    )).toEqual({ selectedYear: 146, isPlaying: true });
  });
});
