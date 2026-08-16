const TAG_COLORS = [
  "bg-melon-soft text-melon-strong",
  "bg-sky-soft text-sky-strong",
  "bg-amber-soft text-amber-strong",
  "bg-berry-soft text-berry-strong",
  "bg-sage-soft text-sage-strong",
  "bg-coral-soft text-coral-strong",
  "bg-violet-soft text-violet-strong",
  "bg-teal-soft text-teal-strong",
];

/** Deterministic color for a category tag, stable across renders and pages. */
export function tagColor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}
