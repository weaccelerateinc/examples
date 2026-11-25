# Accelerate developer docs (Vercel)

Next.js site that publishes the Markdown in [`../docs`](../docs). It replaces the GitBook site at
`developer.weaccelerate.com/3siU1aRQuBacUegbFReN`.

## Content

- `../docs` is the only content source. Edit Markdown there; do not copy pages into this folder.
- `../docs/SUMMARY.md` sets the sidebar order, groups, and nesting.
- Frontmatter: `icon` (Font Awesome name, mapped in `components/PageIcon.tsx`), `description`, `hidden: true`.
- URLs follow the GitBook scheme: `<group>/<parent>/<page>`. The first page is served at `/`.
- Images in `../docs/.gitbook/assets` are copied to `public/assets` before `dev` and `build`.

## Features

Sidebar, on-page TOC, search (`⌘K`), light/system/dark theme, copy page as Markdown, code copy buttons,
Mermaid diagrams, `<page>.md` raw Markdown, `/llms.txt`, and redirects from `/3siU1aRQuBacUegbFReN/*`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Deploy on Vercel

1. Import `weaccelerateinc/examples` as a new Vercel project.
2. Set **Root Directory** to `docs-site`. Keep "Include files outside the root directory" on (default).
3. Framework preset: Next.js. No environment variables are required.
   Optional: `NEXT_PUBLIC_SITE_URL` (default `https://developer.weaccelerate.com`) for canonical and `llms.txt` URLs.
4. To cut over, point `developer.weaccelerate.com` at the Vercel project. Old GitBook links redirect.
