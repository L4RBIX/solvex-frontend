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
```

Only public frontend configuration belongs here. No backend secrets, provider keys, execution-service keys, payment secrets, or privileged service keys belong in Vercel or the frontend.

## Backend

The Railway backend URL is configured through `NEXT_PUBLIC_API_URL`.

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
- Environment variable: `NEXT_PUBLIC_API_URL=https://web-production-3ea15.up.railway.app`
- Production branch: `main`
