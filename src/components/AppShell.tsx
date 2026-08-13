import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

const NAV_LINKS = [
  { href: "/", label: "Dashboard", short: "Home" },
  { href: "/guests", label: "Guests", short: "Guests" },
  { href: "/budget", label: "Budget", short: "Budget" },
  { href: "/todos", label: "To-Dos", short: "To-Dos" },
  { href: "/settings", label: "Settings", short: "Settings" },
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-melon to-berry font-display text-base text-white sm:h-9 sm:w-9 sm:text-lg">
              I
            </div>
            <div className="hidden font-display text-lg sm:block">
              I Do <span className="text-melon-strong">List</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex md:gap-1">
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

          <div className="flex items-center gap-2 sm:gap-3">
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

      <main className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 sm:pb-32 md:pb-16">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.68rem] font-bold ${
              active === link.href ? "text-melon-strong" : "text-text-muted"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                active === link.href ? "bg-melon" : "bg-transparent"
              }`}
            />
            {link.short}
          </Link>
        ))}
      </nav>
    </div>
  );
}
