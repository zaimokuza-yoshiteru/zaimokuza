# zaimokuza — personal site

Personal blog of Zaimokuza: a particle portrait, blog, open-source works, a repository observatory, and experience cards. Warm beige palette, handwritten accents, and native system cursors.

## Maintenance guides

- Read [docs/architecture.md](./docs/architecture.md) before changing data collection, snapshots, routing, article loading, fonts, or deployment.
- Read [docs/design.md](./docs/design.md) before changing layout, styling, repository panels, or interactions. It records the shared tokens and alignment constraints.
- Keep these guides consistent with the final implementation; personal research notes belong in ignored `tmp/`, not in shared documentation.

## Commands

- Use Node.js 24.12+; CI runs Node 24. `npm run typecheck` checks app code and `scripts/**/*.ts` independently with strict settings.
- `npm run sync:repos` — collect both snapshots, validate both with the browser schema, then write both; errors before writing leave both existing files intact.

- `npm run dev` — Vite dev server
- `npm run build` / `npm run preview` — production build (`tsc --noEmit` first) / preview
- `npm run test:blog` — validate the nine-question article, source manifest, sketch assets and run all Python / TypeScript examples (Python 3.10+ with SQLite FTS5 and Node.js 24).
- `npm run test:particles` — check particle bounds, local bounded disturbance and stable return to rest (Node.js 24).
- `npm run test:metrics` — check the live repo-metrics refresh (caching, staleness, partial and total failure, anonymous-quota cap) and the observatory's pure calculations in `src/lib/repoActivity.ts`.
- `npm run test:snapshots` — validate both `src/data/projects.json` and `src/data/starred.json` against the runtime schema in `src/lib/repoSource.ts`, check browser fallback, and run collector failure/retry tests. Real snapshot validation remains separate from synthetic edge cases: never require live data to contain a particular case such as an empty activity array.
- `node scripts/fetch-github.ts` — regenerate `src/data/projects.json` from the GitHub API (requires the `gh` CLI, authenticated). Reads the pinned repositories of `zaimokuza-yoshiteru` in pin order via GraphQL, skips the repos listed in `EXCLUDE` (currently empty — this site's own repository is pinned and shown like any other work), then enriches each one through `scripts/lib/repo-metrics.ts`.
- `node scripts/fetch-github-starred.ts` — regenerate `src/data/starred.json` (requires the `gh` CLI, authenticated). The curated `WATCHED` list defines which repositories appear and in what order.

## Required invariants

- `src/data/profile.ts` owns profile and UI copy, blog metadata, and curated project descriptions. Article bodies live in `src/data/articles/`; each post requires an `article` key.
- `src/data/projects.json` and `src/data/starred.json` are generated and must not be hand-edited. Their public schema is validated by `src/lib/repoSource.ts`; change the validator with any contract change.
- Collect and validate both snapshots before writing either. Browser fetch failures retain the bundled or last valid data. Snapshot refresh commits do not redeploy the site.
- Browser GitHub requests are anonymous and scoped to the visible page. Do not embed credentials. Keep per-repository cache timestamps and stop remaining requests on rate limiting.
- Runtime asset URLs and internal links must include `import.meta.env.BASE_URL`; `index.html` uses `%BASE_URL%`. CSS font URLs are rewritten by Vite; keep them matched to their preloads.
- Use existing theme tokens, shared `GithubLink` / `ExternalArrow`, and presentational components. Keep native cursors, reduced-motion support, and keyboard focus behavior.
- Keep all three font files with their corresponding OFL notices. Article source quotations retain their attribution and verification manifest; standalone teaching examples remain tested by `test:blog`.

## Local files

- `node_modules/`, `dist/`, `.idea/`, `output/`, and `tmp/` are ignored. `output/` contains personal resume materials; `tmp/` contains research and render intermediates. Neither is a site dependency.
- Environment files stay local; only sanitized `.env.example`, `.env.sample`, and `.env.template` may be committed.
- Python caches, coverage output, TypeScript build metadata, and development logs are ignored. Keep the lockfile, tests, public assets, generated repository snapshots, and shared docs in Git.

## Conventions

- Code comments are written in **Chinese**; this document and commit messages may be English/Chinese.
- **TypeScript strict mode** (`strict` + `noUnusedLocals/Parameters`); `tsc --noEmit` is part of `npm run build`. Data collectors, sync orchestration and related tests use TypeScript, with `tsconfig.scripts.json` enforcing strict checking and erasable syntax. Runtime imports include `.ts`; Node 24 runs them directly. Blog/particle test runners remain independent `.mjs` scripts.
- Tailwind v4 (via `@tailwindcss/vite`) with arbitrary values (`text-[15px]`); theme tokens only through `@theme`, no `tailwind.config.js`.
- Keep components presentational; no state management library.
