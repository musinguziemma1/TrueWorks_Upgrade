<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Git workflow

- **Always push changes to GitHub.** When a task is complete, commit the verified
  change on the current branch and run `git push origin <branch>`
  (remote: `https://github.com/musinguziemma1/TrueWorks_Upgrade.git`).
- Stage specific files rather than `git add -A`, so unrelated untracked tooling
  directories are not swept into the commit.
- Keep commits focused and use conventional prefixes (`feat(scope):`,
  `fix(scope):`, `chore(scope):`, `docs:`), matching existing commit history.
- Validate before pushing (`npx tsc --noEmit`, plus `npm test` / `npm run lint`
  where relevant); do not push a failing build.
