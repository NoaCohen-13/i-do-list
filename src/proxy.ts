import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/session-tasks(.*)",
  "/privacy",
  // Vercel Cron calls these with a CRON_SECRET bearer header, not a Clerk
  // session — the route handlers check that secret themselves. Without this
  // exemption every cron request got redirected to /sign-in before it ever
  // reached the handler, so scheduled syncs/reminders silently never ran.
  "/api/cron(.*)",
]);

// auth.protect()'s built-in redirect can resolve to an empty sign-in URL in
// the Next.js 16 proxy runtime (NEXT_PUBLIC_* vars aren't reliably readable
// there), which sends signed-out users into a 404 instead of /sign-in.
// See https://github.com/clerk/javascript/issues/8302 — redirect explicitly
// instead of relying on auth.protect().
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
