import { describe, it, expect } from "vitest";
import { extractSheetId } from "@/lib/google-sheet-sync";

describe("extractSheetId", () => {
  it("extracts the ID from a full edit URL", () => {
    expect(
      extractSheetId("https://docs.google.com/spreadsheets/d/1AbC-XyZ_123/edit#gid=0")
    ).toBe("1AbC-XyZ_123");
  });

  it("extracts the ID from a share URL without a trailing path", () => {
    expect(extractSheetId("https://docs.google.com/spreadsheets/d/1AbC-XyZ_123")).toBe(
      "1AbC-XyZ_123"
    );
  });

  it("accepts a bare sheet ID (no URL)", () => {
    const id = "1AbC-XyZ_123456789012345";
    expect(extractSheetId(id)).toBe(id);
  });

  it("trims surrounding whitespace before matching", () => {
    expect(extractSheetId("  https://docs.google.com/spreadsheets/d/1AbC-XyZ_123/edit  ")).toBe(
      "1AbC-XyZ_123"
    );
  });

  it("returns null for something that isn't a URL or a plausible ID", () => {
    expect(extractSheetId("not a sheet link")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractSheetId("")).toBeNull();
  });
});
