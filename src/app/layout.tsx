import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const fredoka = localFont({
  src: "../fonts/fredoka-600.woff2",
  weight: "600",
  variable: "--font-display",
  display: "swap",
});

const poppins = localFont({
  src: [
    { path: "../fonts/poppins-500.woff2", weight: "500" },
    { path: "../fonts/poppins-700.woff2", weight: "700" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "I Do List",
  description: "Plan your wedding together — guests, budget, and to-dos in one shared place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider taskUrls={{ "choose-organization": "/session-tasks/choose-organization" }}>
      <html lang="en" className={`${fredoka.variable} ${poppins.variable} h-full`} suppressHydrationWarning>
        <body className="min-h-full flex flex-col antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
