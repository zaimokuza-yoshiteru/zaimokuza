# zaimokuza

Personal website of **Zaimokuza** — full-stack engineer. Intro, open-source works, and experience timeline in one warm, quiet page.

> **Design credit**: this site is a loving homage to the [Xiaomi MiMo homepage](https://mimo.mi.com/). Its lively interactions, elegant styling, and layout — the custom cursor, the mouse-following invert mask, the gentle reveal animations — were the inspiration and reference for everything you see here.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · lottie-web

## Develop

```bash
npm install
npm run dev        # dev server
npm run build      # tsc --noEmit + production build
npm run preview    # preview the production build
node scripts/fetch-github.mjs   # refresh src/data/projects.json from GitHub (needs gh CLI)
```

## Content

All copy lives in `src/data/profile.ts` — edit that one file to update the whole site. For design tokens and the interaction system, see [AGENTS.md](./AGENTS.md).

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes `dist` to GitHub Pages. The site is served from the `/zaimokuza/` sub-path, so Vite sets `base` accordingly for builds — reference static assets through `import.meta.env.BASE_URL`, never with a leading `/`.

## License

MIT
