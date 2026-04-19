# CLAUDE.md — Pusdaop DokumenOP

## Project Overview

Pusdaop DokumenOP is a document management system with a custom DOCX editor (ProseMirror-based), supporting respondent/admin workflows for government document procurement.

**Live URL**: https://suratop.vercel.app
**Repo**: https://github.com/rakanormalisasi2-sketch/DokumenOP
**Branch**: `deployment`

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **DOCX Editor**: Custom ProseMirror-based editor (`src/lib/docx-editor/`)
- **Database**: Supabase (PostgreSQL) — project ref: `tjllxhjdotdhlgtttrix`
- **Storage**: Cloudflare R2 (S3-compatible) — bucket: `pusdaop-templates`
- **Deployment**: Vercel + GitHub Actions (branch: `deployment`)

## CLI Tools

| Tool | Path | Version |
|------|------|---------|
| Supabase CLI | `C:\Users\raka\supabase-cli\supabase.exe` | 2.90.0 |
| Vercel CLI | `vercel` (npm global) | 51.7.0 |
| Wrangler | `wrangler` (npm global) | 4.83.0 |

## Environment Variables

All stored in `.env` (NOT committed to git). See `.env` for actual values.

Key vars:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PROJECT_ID`
- `VITE_R2_ACCOUNT_ID`, `VITE_R2_BUCKET`, `VITE_R2_ACCESS_KEY_ID`, `VITE_R2_SECRET_ACCESS_KEY`, `VITE_R2_PUBLIC_URL`

## Database

- **Supabase project**: `tjllxhjdotdhlgtttrix` — ACTIVE_HEALTHY
- **Migration file**: `supabase/migrations/001_initial_schema.sql`
- **Tables**: `users`, `access_requests`, `form_fields`, `document_templates`, `submissions`, `contract_drafts`
- **Apply migration**: `supabase db push` (requires `SUPABASE_DB_PASSWORD` env var)
- **DB Password**: Available in Supabase Dashboard → Settings → Database → Connection String

## Editor Architecture

The DOCX editor lives in `src/lib/docx-editor/`. Key components:
- `DocxEditor.tsx` — Core editor with ProseMirror plugins
- `Ribbon.tsx` — Office-style ribbon tabs (HOME, INSERT, LAYOUT, REFERENCES, REVIEW, VIEW)
- `NativeDocxEditor.tsx` — Wrapper component used in pages
- `MiniToolbar.tsx` — Floating formatting toolbar on text selection
- `Toolbar.tsx` — Additional toolbar (table tools, etc.)

See plan file for full Phase 1-7 enhancement roadmap.

## Git Workflow

- Push to `deployment` branch → triggers GitHub Actions → deploys to Vercel
- All credentials stored locally only — NOT in git

## Quick Commands

```bash
# Development
npm install && npm run dev

# Deploy to production
vercel --prod --token <VERCEL_TOKEN>

# Push database migration
SUPABASE_ACCESS_TOKEN=<TOKEN> SUPABASE_DB_PASSWORD=<PASSWORD> supabase db push --db-url "postgresql://postgres:<PASSWORD>@db.tjllxhjdotdhlgtttrix.supabase.co:5432/postgres"

# List Vercel env vars
vercel env ls production
```
