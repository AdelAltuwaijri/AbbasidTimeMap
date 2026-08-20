import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TimelineBar } from "./timeline-bar";

describe("TimelineBar", () => {
  afterEach(cleanup);
  it("changes years through adjacent controls and selector", () => {
    const dispatch = vi.fn();
    render(<TimelineBar dispatch={dispatch} state={{ selectedYear: 145, isPlaying: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "السنة السابقة" }));
    fireEvent.click(screen.getByRole("button", { name: "السنة التالية" }));
    fireEvent.change(screen.getByRole("slider", { name: "اختيار السنة الهجرية" }), { target: { value: "150" } });
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: "previous" });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: "next" });
    expect(dispatch).toHaveBeenNthCalledWith(3, { type: "set-year", year: 150 });
  });

  it("plays, pauses, and stops at the configured upper bound", () => {
    const dispatch = vi.fn();
    const { rerender } = render(<TimelineBar dispatch={dispatch} state={{ selectedYear: 145, isPlaying: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "تشغيل" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "play" });
    rerender(<TimelineBar dispatch={dispatch} state={{ selectedYear: 145, isPlaying: true }} />);
    fireEvent.click(screen.getByRole("button", { name: "إيقاف التشغيل" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "pause" });
    rerender(<TimelineBar dispatch={dispatch} state={{ selectedYear: 170, isPlaying: false }} />);
    expect(screen.getByRole("button", { name: "السنة التالية" })).toBeDisabled();
  });
});
