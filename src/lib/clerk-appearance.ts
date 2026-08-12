import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#ef4b6e",
    colorBackground: "#fffbfa",
    colorText: "#39232b",
    colorTextSecondary: "#93707a",
    colorInputBackground: "#ffffff",
    colorInputText: "#39232b",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-body), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border border-[var(--border)]",
  },
};
