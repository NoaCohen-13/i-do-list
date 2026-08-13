import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    { path: "/api/cron/sync-sheets", schedule: "0 6 * * *" },
    { path: "/api/cron/send-reminders", schedule: "0 7 * * *" },
  ],
};
