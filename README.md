CyberWordament Frontend
=======================

Overview
--------
- Location: `frontend`
- Stack: Vite + React 18 + TypeScript, Tailwind CSS, Radix UI, shadcn/ui, TanStack Query, React Router
- Testing: Vitest + Testing Library
- Built artifacts: `frontend/dist`
- Docker: `frontend/Dockerfile` + `nginx.conf` for static hosting of `dist`

App structure
-------------
- Entry: `src/main.tsx` mounts providers (React Query, I18n, Auth, Tooltip, Toaster) and renders `App`
- Routing: `src/App.tsx`
  - Public: `/` (SignIn), `/signup`
  - Protected (requires auth + hydration): `/dashboard`, `/puzzle`, `/wordsearch`, `/unjumble`, `/leaderboard`, `/champions`
  - Fallback: `*` → NotFound
- Auth / session: `src/lib/auth-context.tsx`
  - Persists `auth_user`, `auth_expiry` (5-minute sliding window), `lang`, `auth_name_map` in `localStorage`
  - **Backend required**: `signIn` / `signUp` throw on backend failure — no offline fallback (previous fallback was a security bypass and has been removed)
  - Clears per-puzzle completion keys when switching users
  - Bumps expiry on user activity events (`click`, `keydown`, `mousemove`, `touchstart`)
- Config: `src/lib/config.ts` sets `API_BASE = VITE_API_BASE || "http://localhost:4000"` (trailing slash removed)
- I18n: `src/lib/i18n.tsx` provides English/Japanese strings; language stored in `localStorage` (`lang`)

Pages
-----
- `SignIn` / `SignUp`: forms capture name/email/password (+ region/language for sign-up); call backend `/auth/*`
- `Dashboard`: today's puzzle CTAs (one card per type per slot), user stats (puzzles completed, current streak, best time), countdown to next puzzle reset (Stockholm midnight)
- `Puzzle` (Crossword): grid input with arrow-key navigation and direction-aware cursor advance; full Japanese IME support (kana split into individual cells on `compositionEnd`)
- `WordSearch`: drag-to-select grid; words found highlighted with celebration animation
- `Unjumble`: per-word answer inputs with hint display
- `Leaderboard`: hits `/leaderboard` and `/leaderboard/user-stats/:id`; regional filter tabs
- `Champions`: hits `/leaderboard/regional-champions`; today / week / all-time sections
- All puzzle pages share a 10-minute timer that auto-submits on timeout and shows a celebration overlay on submission (with score / time / emojis)

Japanese IME notes
------------------
The Crossword grid (`src/pages/Puzzle.tsx`) handles Full Width Katakana, Half Width Katakana, and Hiragana input modes via a captured composition value:
- `compositionStart` → set `isComposing` flag, allow intermediate display
- `compositionUpdate` → capture the latest composed text in a ref (survives React's controlled-input reset)
- `compositionEnd` → split composed text into graphemes (Intl.Segmenter, ja locale) and distribute across consecutive cells in the active word's direction
- `justComposed` flag suppresses the trailing `onChange` that fires immediately after compositionEnd

This means typing `bisshingu` → IME composes ビ + ッシ + ン + グ → 5 cells filled in one Down word.

UI components
-------------
- shadcn primitives in `src/components/ui/*`
- Layout helpers: `AppHeader`, `NavLink`
- Styling: Tailwind config in `tailwind.config.ts`; globals in `src/index.css`

Scripts
-------
- `npm run dev` – Vite dev server (default port 8080; falls back to 8081 if in use)
- `npm run build` – production bundle into `dist/`
- `npm run build:dev` – dev-mode bundle
- `npm run preview` – serve built assets locally
- `npm run lint` – ESLint
- `npm run test` / `npm run test:watch` – Vitest

Local development
-----------------
1. `cd frontend && npm install`
2. Copy `.env.example` → `.env.local` and set `VITE_API_BASE=http://localhost:3000` (or wherever backend runs)
3. Make sure the backend is reachable at `VITE_API_BASE`. **There is no offline mode** — sign-in fails if backend is unreachable.
4. `npm run dev` and open the printed port (8080 or 8081)

Deployment notes
----------------
- Build with `npm run build`; deploy `dist` via any static host or the provided Dockerfile
- Production EC2 path: `/var/www/wordament/frontend/dist/` (served by nginx)
- Deploy via:
  ```bash
  npm run build
  rsync -az --delete -e "ssh -i ~/.ssh/<key>.pem" dist/ ubuntu@<host>:/var/www/wordament/frontend/dist/
  ```
- Ensure reverse proxy / CORS allows the chosen API base
- Client-side session expiry (5-minute sliding window on user activity) is enforced only on the client; no JWT/CSRF

Live URL
--------
`https://cyberwordament.ohlalingo.com`

Corporate proxy notes
---------------------
Some enterprise SSL inspection products (Zscaler, Netskope, etc.) intercept localhost traffic and reject "localhost" as an invalid hostname, returning HTTP 400. Workarounds:
- Use `http://127.0.0.1:<port>` instead of `localhost`
- Run backend on a less common port (e.g., `4567`) instead of `3000` (which is on many corporate proxy watchlists)
- Update `VITE_API_BASE` in `.env.local` to match
