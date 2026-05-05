# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Vidura Studios — an EdTech SaaS platform for uploading PDFs, generating AI-structured courses, and creating video scripts.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server artifact, currently unused by frontend)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (pdfs bucket)
- **Frontend**: React + Vite + Tailwind CSS + wouter (routing)
- **PDF parsing**: pdfjs-dist v5.7.284
- **AI**: Ollama API (http://localhost:11434) with mock fallback

## Artifacts

### `artifacts/vidura-studios` — Main web app (preview path: `/`)
- **Framework**: React + Vite + Tailwind CSS
- **Routing**: wouter v3
- **Auth**: Supabase Auth via `src/contexts/AuthContext.tsx`
- **Protected routes**: `src/components/ProtectedRoute.tsx`

#### Pages
- `/` — Landing page
- `/login` — Supabase email/password auth
- `/signup` — Account creation with profile storage
- `/dashboard` — PDF upload, projects list (real Supabase data)
- `/script-generator` — Scene-by-scene script editor (real DB data)
- `/course-structure` — Expandable module/topic breakdown (real DB data)
- `/settings` — Profile update, sign out

#### Key source files
- `src/lib/supabase.ts` — Supabase client + env var exports
- `src/lib/database.ts` — All DB operations (projects, modules, topics, scenes)
- `src/lib/ai.ts` — PDF text extraction (pdfjs-dist) + Ollama API + mock fallback
- `src/contexts/AuthContext.tsx` — Auth state, profile, sign in/up/out
- `src/components/DashboardLayout.tsx` — Sidebar + topbar layout for authenticated pages
- `src/components/ProtectedRoute.tsx` — Redirects unauthenticated users to /login

#### Environment variables (in `.env`)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_KEY` — Supabase anon key
- `VITE_AI_API_KEY` — Ollama base URL (e.g. http://localhost:11434)

#### Supabase setup required
Run `supabase-schema.sql` in the Supabase SQL Editor to create:
- `profiles` table (auto-created on signup via trigger)
- `projects` table
- `modules` table
- `topics` table
- `scenes` table
Create a `pdfs` storage bucket (public) in the Supabase Dashboard.

## Design System
- **Font**: Manrope (Google Fonts)
- **Background**: `#FFFFFF`
- **Text**: `#1a1a1a`
- **Sidebar/Cards**: `#F0F4F4`
- **Primary/Active**: `#004D40` (teal)
- **Highlights/Export**: `#CCAC00` (gold)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/vidura-studios run dev` — run frontend locally
