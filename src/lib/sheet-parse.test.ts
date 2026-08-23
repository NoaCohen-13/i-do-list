import { describe, it, expect } from "vitest";
import { parseGuestRows, parseBudgetRows } from "@/lib/sheet-parse";

describe("parseGuestRows", () => {
  it("assigns rows to the most recent group header", () => {
    const rows = [
      ["Notes", "Qty", "Name"],
      ["Noa's Family", "", ""],
      ["", "4", "The Cohen Family"],
      ["Groom's Family", "", ""],
      ["", "2", "The Levi Family"],
    ];
    const parsed = parseGuestRows(rows);
    expect(parsed).toEqual([
      { householdName: "The Cohen Family", partySize: 4, groupName: "Noa's Family", notes: null, rowKey: "guest:Noa's Family:The Cohen Family" },
      { householdName: "The Levi Family", partySize: 2, groupName: "Groom's Family", notes: null, rowKey: "guest:Groom's Family:The Levi Family" },
    ]);
  });

  it("keys rows by group + name, not row position, so edits don't create duplicates on re-sync", () => {
    const before = parseGuestRows([
      ["Notes", "Qty", "Name"],
      ["", "3", "The Cohen Family"],
    ]);
    // Same household, but a row was inserted above it in the sheet.
    const after = parseGuestRows([
      ["Notes", "Qty", "Name"],
      ["", "1", "A New Family"],
      ["", "3", "The Cohen Family"],
    ]);
    const cohenBefore = before.find((r) => r.householdName === "The Cohen Family");
    const cohenAfter = after.find((r) => r.householdName === "The Cohen Family");
    expect(cohenBefore?.rowKey).toBe(cohenAfter?.rowKey);
  });

  it("gives a household a new rowKey if its name changes, since it's a content-based key", () => {
    const original = parseGuestRows([
      ["Notes", "Qty", "Name"],
      ["", "3", "The Cohen Family"],
    ])[0];
    const renamed = parseGuestRows([
      ["Notes", "Qty", "Name"],
      ["", "3", "The Cohen-Levi Family"],
    ])[0];
    expect(original.rowKey).not.toBe(renamed.rowKey);
  });

  it("skips rows with no name", () => {
    const parsed = parseGuestRows([
      ["Notes", "Qty", "Name"],
      ["", "2", ""],
    ]);
    expect(parsed).toHaveLength(0);
  });

  it("skips total/summary rows", () => {
    const parsed = parseGuestRows([
      ["Notes", "Qty", "Name"],
      ["", "50", "סה\"כ"],
      ["", "3", "The Cohen Family"],
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].householdName).toBe("The Cohen Family");
  });

  it("returns an empty list for an empty sheet", () => {
    expect(parseGuestRows([])).toEqual([]);
  });
});

describe("parseBudgetRows", () => {
  it("fills down the category for rows after the first in a group", () => {
    const rows = [
      ["Category", "Item", "Vendor", "Contact", "Phone", "Committed", "Paid", "Balance", "Date", "Notes"],
      ["Venue", "Hall rental", "", "", "", "10000", "5000", "", "", ""],
      ["", "Catering", "", "", "", "8000", "0", "", "", ""],
    ];
    const parsed = parseBudgetRows(rows);
    expect(parsed.map((r) => r.category)).toEqual(["Venue", "Venue"]);
  });

  it("keys rows by category + item name, not row position", () => {
    const parsed = parseBudgetRows([
      ["Category", "Item", "Vendor", "Contact", "Phone", "Committed", "Paid", "Balance", "Date", "Notes"],
      ["Venue", "Hall rental", "", "", "", "10000", "5000", "", "", ""],
    ]);
    expect(parsed[0].rowKey).toBe("budget:Venue:Hall rental");
  });

  it("parses currency strings with symbols/commas into plain numbers", () => {
    const parsed = parseBudgetRows([
      ["Category", "Item", "Vendor", "Contact", "Phone", "Committed", "Paid", "Balance", "Date", "Notes"],
      ["Venue", "Hall rental", "", "", "", "₪10,000.50", "₪5,000", "", "", ""],
    ]);
    expect(parsed[0].committedCost).toBe(10000.5);
    expect(parsed[0].paidAmount).toBe(5000);
  });

  it("treats a missing/blank committed or paid cell as 0", () => {
    const parsed = parseBudgetRows([
      ["Category", "Item", "Vendor", "Contact", "Phone", "Committed", "Paid", "Balance", "Date", "Notes"],
      ["Venue", "Hall rental", "", "", "", "", "", "", "", ""],
    ]);
    expect(parsed[0].committedCost).toBe(0);
    expect(parsed[0].paidAmount).toBe(0);
  });

  it("skips rows with no item name", () => {
    const parsed = parseBudgetRows([
      ["Category", "Item", "Vendor", "Contact", "Phone", "Committed", "Paid", "Balance", "Date", "Notes"],
      ["Venue", "", "", "", "", "1000", "0", "", "", ""],
    ]);
    expect(parsed).toHaveLength(0);
  });
});
