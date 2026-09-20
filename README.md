# zaimokuza

Personal website of Zaimokuza, with a particle portrait, blog, open-source projects, repository observatory, and experience timeline.

[Visit the site](https://zaimokuza-yoshiteru.github.io/zaimokuza/)

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4

## Development

Requires Node.js 24.12+.

```bash
npm ci
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run build` | Type-check the app and scripts, then build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Check app and script TypeScript types |
| `npm run test:blog` | Validate article sources, assets, and runnable examples |
| `npm run test:particles` | Check particle bounds and motion |
| `npm run test:metrics` | Check repository counters, caching, and observatory calculations |
| `npm run test:snapshots` | Validate snapshots, collectors, and sync failure handling |
| `npm run sync:repos` | Collect and validate both GitHub snapshots before writing them |

Blog example tests also require Python 3.10+ with SQLite FTS5. Refreshing repository data requires an authenticated GitHub CLI (`gh`).

## Content

- **Profile and UI copy:** `src/data/profile.ts` contains the greeting, social links, experience, blog metadata, and project descriptions.
- **Articles:** Markdown lives in `src/data/articles/`; images and sketches live in `public/blog/`.
- **Portrait:** `public/images/hero-portrait.jpg` supplies the Canvas particle portrait.
- **Open-source projects:** The list follows the repositories pinned on the GitHub profile, in pin order.
- **Observatory:** Edit `WATCHED` in `scripts/fetch-github-starred.ts` and descriptions in `profile.starred.entries` to change the followed repositories.

`src/data/projects.json` and `src/data/starred.json` are generated snapshots; update them with `npm run sync:repos` instead of editing them by hand.

See [AGENTS.md](./AGENTS.md) for development conventions, [architecture.md](./docs/architecture.md) for data and deployment details, and [design.md](./docs/design.md) for layout and interaction rules.

Personal resume materials in `output/` and research notes in `tmp/` stay local and are ignored by Git. Neither directory is needed to build the site.

## Repository data

The site renders bundled snapshots first. A scheduled workflow refreshes both snapshots every 12 hours; the browser loads the updated data from this repository without requiring a new deployment. Stars, forks, and open issue counts also refresh through the public GitHub API with a 15-minute cache per repository. Failed requests retain the previous data.

The site needs no backend or embedded token. The scheduled collector uses GitHub Actions' temporary `GITHUB_TOKEN`.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml` and publishes `dist` to GitHub Pages.

Production uses the `/zaimokuza/` base path. Prefix runtime asset URLs and internal links with `import.meta.env.BASE_URL`; use `%BASE_URL%` in `index.html`. Vite rewrites asset URLs in CSS during the build.

## License

[MIT](./LICENSE) for project code. Bundled fonts retain their SIL Open Font License notices in `public/fonts/`; third-party article quotations retain their source attribution and original licenses.
