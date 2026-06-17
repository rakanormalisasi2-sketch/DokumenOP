# AI Workspace Context - Handover Document

## Tujuan File Ini
File ini dibuat agar ketika project ini dipindahkan ke perangkat/laptop lain, asisten AI yang baru dapat dengan cepat memahami konteks, struktur, progres, dan fungsi-fungsi dalam project ini tanpa harus menganalisa dari awal.

## Deskripsi Project
**Pusdaop DokumenOP** adalah sistem manajemen dokumen untuk pengadaan pemerintah yang dilengkapi dengan editor DOCX kustom (berbasis ProseMirror). Sistem ini memfasilitasi alur kerja antara responden dan admin.

## Tech Stack Utama
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Editor**: Custom DOCX Editor menggunakan ProseMirror (`src/lib/docx-editor/`)
- **Backend & Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible) untuk menyimpan template
- **Deployment**: Vercel & GitHub Actions (branch `deployment`)

## Arsitektur & Direktori Penting
- `src/lib/docx-editor/`: Berisi implementasi utama editor DOCX. Terdapat plugin ProseMirror, Ribbon Office-style, dan native wrapper.
- `CLAUDE.md`: Berisi panduan lengkap mengenai arsitektur, ID Supabase, struktur database, CLI, dan workflow Git. **AI HARUS membaca file ini untuk memahami detail operasional backend dan editor.**
- `README.md`: Berisi panduan setup lokal.

## Progres Saat Ini
- Project sudah memiliki fondasi editor DOCX yang cukup kompleks (ProseMirror dengan sinkronisasi ke React).
- Setup routing, komponen UI (shadcn), dan integrasi database (Supabase) sudah disiapkan.
- Terdapat fungsi untuk deployment otomatis ke Vercel melalui GitHub branch `deployment`.

## Instruksi untuk AI Selanjutnya (Next AI Assistant)
1. Baca file `CLAUDE.md` untuk memahami environment variables dan koneksi Supabase.
2. Cek `package.json` untuk melihat dependency yang terinstall.
3. Tanyakan kepada pengguna (USER) bagian mana yang ingin dilanjutkan (misalnya penambahan fitur pada editor, perbaikan UI, atau integrasi backend).
