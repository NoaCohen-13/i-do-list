const TOTAL_ROW_MARKERS = ["סה\"כ", "סה״כ", "סהכ", "total", "sum"];

function isBlank(v: string | undefined) {
  return !v || v.trim() === "";
}

export type ParsedGuestRow = {
  householdName: string;
  partySize: number;
  groupName: string | null;
  notes: string | null;
  rowKey: string;
};

/**
 * Expects rows in [notes, partySize, householdName] column order (matching
 * a typical "guest list" spreadsheet layout), with row 0 as the header.
 * Blank-quantity/blank-name rows whose notes cell has text are treated as
 * section/group headers that apply to subsequent rows.
 */
export function parseGuestRows(rows: string[][]): ParsedGuestRow[] {
  if (rows.length === 0) return [];

  const out: ParsedGuestRow[] = [];
  let currentGroup: string | null = null;

  // The header row's first cell sometimes carries a merged group label
  // (common when the source sheet's first section header row merges into
  // the header itself on CSV export). If it doesn't look like a plain
  // "notes" label, treat it as the first group name.
  const headerNotes = (rows[0]?.[0] ?? "").trim();
  if (headerNotes && !/^(notes?|comments?|הערות)$/i.test(headerNotes)) {
    currentGroup = headerNotes.replace(/^הערות\s*/, "").trim() || null;
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const notes = (row[0] ?? "").trim();
    const qtyRaw = (row[1] ?? "").trim();
    const name = (row[2] ?? "").trim();

    if (isBlank(qtyRaw) && isBlank(name)) {
      if (!isBlank(notes)) currentGroup = notes;
      continue;
    }

    if (isBlank(name)) continue;
    if (TOTAL_ROW_MARKERS.some((m) => name.toLowerCase().includes(m.toLowerCase()))) continue;

    const partySize = Number(qtyRaw.replace(/[^\d.-]/g, "")) || 0;

    out.push({
      householdName: name,
      partySize,
      groupName: currentGroup,
      notes: notes || null,
      rowKey: `guest:${i}:${name}`,
    });
  }

  return out;
}

export type ParsedBudgetRow = {
  category: string;
  itemName: string;
  vendorName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  committedCost: number;
  paidAmount: number;
  notes: string | null;
  rowKey: string;
};

function parseMoney(v: string | undefined) {
  if (!v) return 0;
  const cleaned = v.replace(/[^\d.-]/g, "");
  return cleaned ? Number(cleaned) : 0;
}

/**
 * Expects columns: [category, itemName, vendorName, contactName, contactPhone,
 * committedCost, paidAmount, balance, lastPaymentDate, notes], row 0 = header.
 * Category is fill-down (only present on the first row of each group, as is
 * typical when the source column is a vertically merged cell).
 */
export function parseBudgetRows(rows: string[][]): ParsedBudgetRow[] {
  if (rows.length === 0) return [];

  const out: ParsedBudgetRow[] = [];
  let currentCategory = "";

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const category = (row[0] ?? "").trim();
    const itemName = (row[1] ?? "").trim();

    if (category) currentCategory = category;
    if (isBlank(itemName)) continue;
    if (TOTAL_ROW_MARKERS.some((m) => currentCategory.toLowerCase().includes(m.toLowerCase()))) continue;

    out.push({
      category: currentCategory || "Other",
      itemName,
      vendorName: (row[2] ?? "").trim() || null,
      contactName: (row[3] ?? "").trim() || null,
      contactPhone: (row[4] ?? "").trim() || null,
      committedCost: parseMoney(row[5]),
      paidAmount: parseMoney(row[6]),
      notes: (row[9] ?? "").trim() || null,
      rowKey: `budget:${i}:${itemName}`,
    });
  }

  return out;
}
