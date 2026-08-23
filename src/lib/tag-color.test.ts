import { describe, it, expect } from "vitest";
import { tagColor } from "@/lib/tag-color";

describe("tagColor", () => {
  it("returns the same color for the same label every time", () => {
    expect(tagColor("Venue")).toBe(tagColor("Venue"));
  });

  it("returns a class string in the expected bg/text pair shape", () => {
    expect(tagColor("Catering")).toMatch(/^bg-\S+-soft text-\S+-strong$/);
  });

  it("distributes different labels across more than one color", () => {
    const labels = ["Venue", "Catering", "Photography", "Flowers", "Music", "Attire", "Transport", "Stationery"];
    const colors = new Set(labels.map(tagColor));
    expect(colors.size).toBeGreaterThan(1);
  });

  it("handles an empty string without throwing", () => {
    expect(() => tagColor("")).not.toThrow();
  });
});
