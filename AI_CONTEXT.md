# AI Context: DokumenOP (SuratOP)

**Tujuan File Ini:** File ini dibuat untuk memberikan konteks instan kepada sesi asisten AI yang baru (misalnya saat berpindah perangkat). Jika Anda adalah AI yang membaca ini, gunakan informasi di bawah ini sebagai konteks utama mengenai arsitektur, teknologi, dan riwayat proyek ini.

## 1. Identitas Proyek
- **Nama Proyek:** DokumenOP / SuratOP
- **Repositori GitHub:** `rakanormalisasi2-sketch/DokumenOP`
- **URL Produksi:** `suratop.vercel.app`
- **Lokasi Lokal Utama:** `g:\project web\pusdaop-main`

## 2. Tech Stack
- **Framework:** React + Vite
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Backend / BaaS:** Supabase
- **Fitur Utama:** Editor Dokumen menggunakan **Syncfusion Essential Studio** dan integrasi **Google Drive**.
- **Package Manager:** npm / bun

## 3. Deployment & DevOps
- **Hosting:** Vercel (Production) & Cloudflare Pages.
- **CI/CD:** Menggunakan GitHub Actions (`.github/workflows/deploy.yml`) untuk build dan deploy.
- **Supabase Keep-Alive:** Terdapat cron job menggunakan GitHub Actions (`keepalive-supabase.yml`) yang melakukan *ping* ke REST API Supabase setiap 3 hari sekali untuk mencegah proyek gratis di-pause secara otomatis.

## 4. Riwayat & Masalah yang Baru Saja Diselesaikan
- **Lisensi Syncfusion:** Masalah *watermark/trial message* dari Syncfusion saat mengedit dokumen (docx) telah diselesaikan dengan mendaftarkan *license key* enterprise yang valid di `src/main.tsx`.
- **Supabase Pause Issue:** Kekhawatiran mengenai proyek Supabase yang ter-pause jika *idle* selama 7 hari telah diatasi dengan membuat GitHub Action untuk *ping* otomatis. Tidak memerlukan layanan pihak ketiga seperti cron-job.org.

## 5. Instruksi untuk AI Selanjutnya
- Proyek ini menggunakan `main` dan `deployment` sebagai branch utama.
- Saat melakukan perubahan, perhatikan file `main.tsx` untuk konfigurasi *environment variables* (Supabase, R2, dll.).
- Gunakan file ini sebagai titik tolak. Semua konfigurasi Vercel dan Supabase sudah aman.
