import { describe, it, expect } from "vitest";
import { isFullyPaid } from "@/lib/budget";

describe("isFullyPaid", () => {
  it("is false when nothing is committed, even if paid is 0", () => {
    expect(isFullyPaid(0, 0)).toBe(false);
  });

  it("is false when a deposit has been paid but not the full amount", () => {
    expect(isFullyPaid(1000, 200)).toBe(false);
  });

  it("is true once the paid amount matches the committed cost exactly", () => {
    expect(isFullyPaid(1000, 1000)).toBe(true);
  });

  it("is true when overpaid", () => {
    expect(isFullyPaid(1000, 1200)).toBe(true);
  });

  it("is false for a committed item with nothing paid yet", () => {
    expect(isFullyPaid(1000, 0)).toBe(false);
  });
});
