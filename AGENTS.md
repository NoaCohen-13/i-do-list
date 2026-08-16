<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Deployment

This project deploys via the Vercel CLI (`vercel --prod`), **not** git-push auto-deploy — there is no GitHub integration triggering builds. Pushing a commit to `main` updates the repo but does **not** update the live site at i-do-list-puce.vercel.app. After pushing a fix the user needs to see live, explicitly run `vercel --prod` (or use the `vercel:deploy` skill) — otherwise production silently keeps serving the old commit and any "fixed and pushed" claim is misleading.
