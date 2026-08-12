import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/guests", label: "Guests" },
  { href: "/budget", label: "Budget" },
  { href: "/todos", label: "To-Dos" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: string;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-melon to-berry font-display text-lg text-white">
              I
            </div>
            <div className="font-display text-lg">
              I Do <span className="text-melon-strong">List</span>
            </div>
          </Link>
          <nav className="flex gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
                  active === link.href
                    ? "bg-melon-soft text-melon-strong"
                    : "text-text-muted hover:bg-surface-2 hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              hidePersonal
              appearance={clerkAppearance}
              afterSelectOrganizationUrl="/"
              afterCreateOrganizationUrl="/"
            />
            <UserButton appearance={clerkAppearance} />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 pb-32">{children}</main>
    </div>
  );
}
