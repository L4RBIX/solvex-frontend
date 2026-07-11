# SolveX Frontend

SolveX is a competitive-programming training platform that analyzes Codeforces history, identifies weaknesses, creates personalized training plans, and provides an Arena with AI Copilot and code execution.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Base UI, shadcn, Lucide React, Monaco Editor, and tw-animate-css

## Main Routes

- `/` - Landing page
- `/analyze` - Analysis dashboard and v1 training panel
- `/arena` - Coding editor with Judge0 execution

## Environment

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_API_URL=https://web-production-3ea15.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Only public frontend configuration belongs here. No backend secrets, provider keys, execution-service keys, payment secrets, or privileged service keys belong in Vercel or the frontend.

## Backend

The Railway backend URL is configured through `NEXT_PUBLIC_API_URL`. Supabase
Auth persists and refreshes the browser session; the FastAPI backend remains
the authority for private SolveX data and maps the verified JWT subject to an
internal user. A Codeforces handle is linked separately and is never login.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Vercel Deployment Settings

- Framework: Next.js
- Root directory: repo root
- Build command: `npm run build`
- Output directory: Vercel auto / blank
- Environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Production branch: `main`

In Supabase Auth URL Configuration, allow the exact production
`/auth/callback`, `http://localhost:3000/auth/callback`, and only the Vercel
preview pattern actually needed by the team. Configure Google credentials in
Supabase, not in Vercel. Backend setup details and rollback guidance live in
`backend/docs/supabase_auth.md` in the sibling backend repository.
