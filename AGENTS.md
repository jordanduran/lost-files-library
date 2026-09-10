<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project practices

Keep this small-to-medium app simple. Add infrastructure only for demonstrated needs.
Never commit secrets or expose private storage paths, service keys, or sensitive user data in client code or logs.
When backend services are introduced, enforce authorization, authoritative prices, input validation, and purchase ownership on the server. Public mock admin/library pages must not become real data views without access controls.
Run appropriate lint, type, build, and critical-flow checks. Make meaningful local commits and push to the authorized repository as work progresses.
