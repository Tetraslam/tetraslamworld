# Repository Guidelines

This guide explains how to work in tetraslamworld (Next.js + TypeScript) so contributions stay consistent and easy to review.

## Project Structure & Module Organization
- `app/`: App Router routes and layouts (e.g., `app/about/page.tsx`). Global styles in `app/globals.css`.
- `components/ui/`: Reusable UI components (files kebab-case; exported components PascalCase).
- `components/client/`: Client-only interactive components (files often PascalCase; include `"use client"` when needed).
- `lib/`: Utilities and data sources (e.g., `travel-data.ts`, `rss.ts`, `firebase.ts`).
- `public/`: Static assets served at the site root.
- Config: `next.config.js/ts`, `tsconfig.json`, `tailwind.config.ts`, `eslint.config.mjs` (also `.eslintrc.json`).

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server at `http://localhost:3000` with HMR.
- `npm run build`: Production build. Runs Next build; `postbuild` generates the sitemap via `next-sitemap`.
- `npm start`: Serve the production build.
- `npm run lint`: Lint TypeScript/React using Next’s core-web-vitals config.
- `npm run vercel-build`: CI build variant that skips linting.

## Coding Style & Naming Conventions
- TypeScript strict mode; prefer function components. Server Components by default; add `"use client"` for client-only code.
- Indentation: 2 spaces. Keep files small and cohesive.
- Components: PascalCase exports. Files in `components/ui` use kebab-case (e.g., `project-card.tsx`); `components/client` often uses PascalCase files (e.g., `VendingMachine.tsx`).
- Styling: Tailwind CSS utilities; compose classes with `clsx`/`cva` when helpful.
- ESLint: extends `next/core-web-vitals` and `next/typescript`; some rules are relaxed (`no-unused-vars`, `no-explicit-any`).

## Testing Guidelines
No test runner is configured. If adding tests, co-locate as `*.test.ts(x)` and propose a runner (e.g., Vitest + React Testing Library) in a separate PR.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (`feat:`, `fix:`, `chore:`). Example: `feat: add San Francisco and San Jose locations`.
- PRs: Include a clear summary, linked issues, screenshots/GIFs for UI, and manual test notes. Ensure `npm run lint` and a local build pass.

## Security & Configuration Tips
- Secrets live in `.env.local` (ignored). Use `NEXT_PUBLIC_*` for client-exposed vars; keep server-only secrets unprefixed.
- Never commit credentials. Review `images.remotePatterns` in `next.config.js` before using new external image hosts.

