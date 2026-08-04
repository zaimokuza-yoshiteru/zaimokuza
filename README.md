# zaimokuza

Personal website of **Zaimokuza** — full-stack engineer. Intro, open-source works, and experience timeline in one warm, quiet page.

> **Design credit**: this site is a loving homage to the [Xiaomi MiMo homepage](https://mimo.mi.com/). Its lively interactions, elegant styling, and layout — the custom cursor, the mouse-following invert mask, the gentle reveal animations — were the inspiration and reference for everything you see here.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · lottie-web

## Develop

```bash
npm install
npm run dev        # dev server
npm run build      # production build
node scripts/fetch-github.mjs   # refresh src/data/projects.json from GitHub (needs gh CLI)
```

## Content

All copy lives in `src/data/profile.js` — edit that one file to update the whole site. For design tokens and the interaction system, see [AGENTS.md](./AGENTS.md).

## License

MIT
