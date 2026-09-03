# InvoiceFlow — Sistem Faktur & Penawaran

Aplikasi web untuk mengelola faktur, penawaran (SPH/quotation), klien, dan pengaturan perusahaan — antarmuka modern dalam Bahasa Indonesia.

Dibangun dengan **Next.js** di **Vercel** dan database **Supabase** (Auth + PostgreSQL).

## Arsitektur

```
website_E-invoice/
├── src/
│   ├── app/              # Next.js App Router (halaman + API routes)
│   │   ├── (app)/        # Area terproteksi (dashboard, faktur, dll.)
│   │   ├── login/
│   │   ├── register/
│   │   └── api/          # PDF & cron keepalive
│   ├── views/            # Halaman UI (React client components)
│   ├── components/       # Layout, Sidebar, UI kit
│   ├── context/          # Auth & settings context
│   ├── lib/              # Supabase API layer, PDF generator
│   └── utils/supabase/   # Supabase SSR clients
├── supabase/
│   └── schema.sql        # Schema + RLS (jalankan di Supabase SQL Editor)
├── vercel.json           # Cron keepalive (free tier Supabase)
├── package.json
└── .env.example
```

## Technology stack

| Lapisan | Teknologi |
|---------|-----------|
| Framework | Next.js 15, React 19 |
| Styling | Tailwind CSS 4 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email/password) |
| Icons | Lucide React |
| PDF | PDFKit (Route Handlers) |
| Deploy | Vercel |

## Fitur utama

- **Dashboard** — ringkasan faktur & penawaran
- **Penawaran (SPH)** — buat, edit, status, unduh PDF
- **Faktur** — buat dari penawaran atau standalone, pembayaran, PDF
- **Klien** — CRUD dengan pencarian
- **Pengaturan** — profil perusahaan, logo, bank, pajak, penomoran dokumen
- **Autentikasi** — register/login per pengguna (data terisolasi via RLS)

## Deploy (step-by-step)

Panduan lengkap: **[DEPLOYMENT.md](DEPLOYMENT.md)** — Supabase → Vercel → checklist uji coba.

## Prasyarat

- **Node.js** 18+
- Akun **Supabase** (gratis)
- Akun **Vercel** (untuk production)

## Setup Supabase (sekali)

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → jalankan seluruh isi [`supabase/schema.sql`](supabase/schema.sql).
3. **Authentication → Providers → Email** — aktifkan. Untuk development, nonaktifkan **Confirm email** agar bisa langsung login setelah register.
4. Di **Settings → API**, salin:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (hanya origin, tanpa `/rest/v1`)
   - **Publishable** atau **anon** key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Development lokal

File **`.env.local`** ada di root project (sudah disiapkan, tidak ikut Git). Isi dengan kredensial **project Supabase yang sama** yang dipakai production.

1. Supabase → **Project Settings** → **API**
2. Salin **Project URL** dan **publishable** (atau **anon**) key ke `.env.local`
3. Jalankan:

```bash
cd website_E-invoice
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) → daftar di `/register`, lalu login.

Jika belum ada `.env.local`, salin dari contoh:

```bash
cp .env.example .env.local
```

Setelah mengubah `.env.local`, **restart** `npm run dev` (wajib).

## Environment variables

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Ya | Publishable atau anon key |
| `CRON_SECRET` | Production | Secret untuk `/api/cron/keepalive` (Vercel Cron) |

Contoh `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import project di [vercel.com](https://vercel.com) — framework **Next.js** (auto-detect, root repo).
3. Tambahkan environment variables (sama seperti di atas) + `CRON_SECRET` (string acak panjang).
4. Deploy.

`vercel.json` menjalankan cron **keepalive** setiap 2 hari agar project Supabase free tier tetap aktif.

Pengguna pertama: buka `https://<domain-anda>/register`.

## Scripts

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run start    # Jalankan build production
npm run lint     # ESLint
```

## Routes aplikasi

| Path | Deskripsi |
|------|-----------|
| `/` | Dashboard |
| `/login`, `/register` | Autentikasi |
| `/quotations` | Daftar penawaran |
| `/quotations/new`, `/quotations/[id]` | Form penawaran |
| `/invoices` | Daftar faktur |
| `/invoices/select`, `/invoices/new`, `/invoices/[id]` | Form faktur |
| `/clients` | Manajemen klien |
| `/settings` | Pengaturan perusahaan |

## API (Next.js Route Handlers)

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/invoices/[id]/pdf` | Unduh PDF faktur |
| GET | `/api/quotations/[id]/pdf` | Unduh PDF penawaran |
| GET | `/api/cron/keepalive` | Ping database (Vercel Cron) |

Data CRUD (klien, faktur, dll.) dilakukan langsung dari browser ke Supabase dengan **Row Level Security** — setiap user hanya melihat data miliknya.

## Database

Schema didefinisikan di `supabase/schema.sql`:

- `profiles` — profil user (terhubung ke `auth.users`)
- `clients`, `invoices`, `invoice_items`, `payment_records`
- `quotations`, `quotation_items`
- `company_settings`, `bank_accounts`

Trigger `handle_new_user` membuat profil dan pengaturan default saat registrasi.

## Keamanan

- **RLS** di semua tabel bisnis (`auth.uid() = user_id`)
- Session cookie via `@supabase/ssr`
- Middleware Next.js mengarahkan user belum login ke `/login`

## Responsif & dark mode

UI responsif (mobile sidebar) dan mendukung dark mode (preferensi sistem).

---

**InvoiceFlow** — untuk bisnis Indonesia
