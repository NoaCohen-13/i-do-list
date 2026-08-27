# I Do List

A shared wedding-planning app: guest list with RSVP tracking, a budget tracker
with vendors and payment status, a to-do list organized by phase, and a
calendar/reminders layer that ties it all together.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNoaCohen-13%2Fi-do-list&env=CLERK_SECRET_KEY,NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,DATABASE_URL,RESEND_API_KEY,CRON_SECRET&envDescription=API%20keys%20needed%20to%20run%20this%20app%20%E2%80%94%20see%20the%20README%20for%20where%20to%20get%20each%20one&envLink=https%3A%2F%2Fgithub.com%2FNoaCohen-13%2Fi-do-list%23environment-variables&project-name=i-do-list&repository-name=i-do-list)

## Features

- **Guests** — households, party size, RSVP status, grouped totals; import or
  keep in sync from a Google Sheet.
- **Budget** — committed vs. paid per item, auto-marks "done" once an item is
  fully paid, category rollups.
- **To-Dos** — organized by phase, cross-linked with unbooked vendors from the
  budget and upcoming calendar events ("add as task" in one click).
- **Calendar + reminders** — syncs an iCal feed daily, sends an early
  heads-up email plus a day-before reminder for todos and events (via
  [Resend](https://resend.com)).
- **Shared access** — invite a partner or family member with a link; they
  request access and you approve them as a viewer or editor.
- Hebrew/RTL content support, mobile-responsive, drag-and-drop reordering.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · Postgres
([Neon](https://neon.tech)) · [Clerk](https://clerk.com) (auth,
organizations = weddings) · [Resend](https://resend.com) (email) · Vercel
Cron.

## Environment variables

| Variable | Where to get it |
|---|---|
| `CLERK_SECRET_KEY` | [Clerk dashboard](https://dashboard.clerk.com) → API Keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `DATABASE_URL` | [Neon](https://neon.tech) → your project's connection string |
| `RESEND_API_KEY` | [Resend dashboard](https://resend.com/api-keys) |
| `CRON_SECRET` | Any random string you generate yourself (e.g. `openssl rand -hex 32`) — Vercel sends it automatically to your cron routes once set |

Clerk's Organizations feature must be enabled (each organization represents
one wedding). Optionally set `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and
`NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` — this repo ships its own sign-in/
sign-up pages at those routes.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the variables above
npm run db:push              # creates tables in your Postgres database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test
```

## Deploying

Push to `main` and deploy with `vercel --prod`, or use the "Deploy with
Vercel" button above to fork straight to your own Vercel project. After the
first deploy, run `npm run db:push` once (pointed at your production
`DATABASE_URL`) to create the tables.
