# Pusdaop Dokumen Editor

Native DOCX editor setara OnlyOffice dengan fitur lengkap untuk mengelola template dan dokumen.

## Teknologi

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **DOCX Editor**: Custom ProseMirror-based editor dengan layout engine
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Deploy**: Vercel + GitHub Actions

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` ke `.env` dan isi credentials.

## Deployment

Auto-deploy ke Vercel via GitHub Actions pada branch `deployment`.

## CLI Tools

- **Supabase CLI**: `C:\Users\raka\supabase-cli\supabase.exe`
- **Vercel CLI**: `vercel`
- **Wrangler (R2)**: `wrangler`
