import { describe, expect, it } from "vitest";
import {
  bboxSpanTooLarge,
  isInsideVietnam,
  normalizeBBox,
  parseBBox,
} from "./bbox.ts";

describe("bbox", () => {
  it("parses a south,west,north,east box", () => {
    expect(parseBBox("15.8,108.3,15.9,108.4")).toEqual([15.8, 108.3, 15.9, 108.4]);
    expect(parseBBox("15.9,108.3,15.8,108.4")).toBeNull();
    expect(parseBBox("nope")).toBeNull();
  });

  it("keeps queries inside Vietnam and under the span cap", () => {
    const hoiAn = parseBBox("15.85,108.30,15.90,108.36")!;
    expect(isInsideVietnam(hoiAn)).toBe(true);
    expect(bboxSpanTooLarge(hoiAn)).toBe(false);
    expect(bboxSpanTooLarge([10, 103, 16, 109])).toBe(true);
    expect(isInsideVietnam([1, 10, 2, 11])).toBe(false);
  });

  it("pads and rounds tiny boxes", () => {
    expect(normalizeBBox([21.03, 105.85, 21.031, 105.851])).toEqual([
      21.026, 105.846, 21.036, 105.855,
    ]);
  });
});
