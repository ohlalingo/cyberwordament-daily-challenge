CyberWordament Frontend
=======================

Overview
--------
- Location: `frontend`
- Stack: Vite + React 18 + TypeScript, Tailwind CSS, Radix UI, shadcn/ui, TanStack Query, React Router.
- Testing: Vitest + Testing Library; Playwright config present (no recorded tests included).
- Built artifacts: `frontend/dist`
- Docker: `frontend/Dockerfile` + `nginx.conf` for static hosting of `dist`.

App structure
-------------
- Entry: `src/main.tsx` mounts providers (React Query, I18n, Auth, Tooltip, toast) and renders `App`.
- Routing: `src/App.tsx`
  - Public: `/` (SignIn), `/signup`
  - Protected (requires auth + hydration): `/dashboard`, `/puzzle`, `/wordsearch`, `/unjumble`, `/leaderboard`, `/champions`
  - Fallback: `*` -> NotFound
- Auth/session: `src/lib/auth-context.tsx`
  - Persists `auth_user`, `auth_expiry` (5-minute sliding window), `token`, `lang`, `current_user_id` in `localStorage`.
  - Clears per-puzzle completion keys when switching users; bumps expiry on user activity events.
  - API calls target `${API_BASE}/auth/*`; optional `token` stored when returned.
- Config: `src/lib/config.ts` sets `API_BASE = VITE_API_BASE || "http://localhost:4000"` (trailing slash removed).
- I18n: `src/lib/i18n.tsx` provides English/Japanese strings; language stored in `localStorage` (`lang`).
- Pages (key behavior):
  - `SignIn` / `SignUp`: forms capture name/email/password (+ region/language for sign-up); call backend auth.
  - `Dashboard`: surfaces today’s puzzle CTA and user stats.
  - `Puzzle`, `WordSearch`, `Unjumble`: fetch today’s puzzles from `/puzzle/today?lang=`.
  - `Leaderboard`: hits `/leaderboard` and `/leaderboard/user-stats/:id`.
  - `Champions`: hits `/leaderboard/regional-champions`.
- UI components: shadcn primitives in `src/components/ui/*`; layout helpers `AppHeader`, `NavLink`.
- Styling: Tailwind config in `tailwind.config.ts`; globals in `src/index.css` and `src/App.css`.

Scripts
-------
- `npm run dev` – Vite dev server (default port 5173)
- `npm run build` / `npm run build:dev` – production/dev bundles
- `npm run preview` – serve built assets locally
- `npm run lint` – ESLint
- `npm run test` / `npm run test:watch` – Vitest

Local development
-----------------
1) `cd frontend && npm install` (already installed locally).
2) Create `.env` with `VITE_API_BASE=http://localhost:4000` (or target backend URL).
3) `npm run dev` and open the served port.

Deployment notes
----------------
- Build with `npm run build`; deploy `dist` via any static host or the provided Dockerfile.
- Ensure reverse proxy/CORS allows the chosen API base; the app trusts `API_BASE` only.
- Client-side session expiry (5 minutes) is enforced only on the client; no JWT/CSRF baked in. 
