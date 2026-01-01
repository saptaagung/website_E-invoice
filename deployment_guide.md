# Panduan Deployment Gratis (Live Production)

Berikut adalah rekomendasi cara terbaik untuk men-deploy aplikasi InvoiceFlow secara **GRATIS** dan profesional.

Kita akan menggunakan kombinasi layanan terbaik untuk masing-masing bagian:

| Komponen | Layanan | Alasan | Plan |
|----------|---------|--------|------|
| **Frontend** | **Vercel** | Hosting React terbaik, sangat cepat, deploy otomatis dari Git. | **Free** |
| **Backend** | **Render** | Bisa hosting Node.js server secara gratis (auto-sleep jika tidak aktif). | **Free** |
| **Database** | **Supabase** | PostgreSQL managed service yang powerful dan mudah digunakan. | **Free Tier** |

---

## Persiapan Awal

1.  Pastikan kode Anda sudah ada di repository **GitHub** (misalnya: `invoice-flow`).
2.  Struktur folder harus tetap seperti sekarang (`client` dan `server` dalam satu repo).

---

## Langkah 1: Setup Database (Supabase)

1.  Buka [Supabase.com](https://supabase.com) dan buat akun.
2.  Buat **New Project**.
3.  Catat password database Anda.
4.  Setelah project siap, masuk ke **Project Settings -> Database**.
5.  Cari bagian **Connection String** -> pilih **Nodejs**.
6.  Salin URL koneksi. Formatnya kira-kira:
    `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`
    *(Ingat ganti [PASSWORD] dengan password yang Anda buat)*.

---

## Langkah 2: Setup Backend (Render.com)

1.  Buka [Render.com](https://render.com) dan buat akun.
2.  Klik **New +** -> **Web Service**.
3.  Hubungkan dengan repository GitHub Anda.
4.  Konfigurasi:
    *   **Name**: `invoice-api` (bebas)
    *   **Root Directory**: `server` (PENTING!)
    *   **Environment**: `Node`
    *   **Build Command**: `npm install && npx prisma generate`
    *   **Start Command**: `npm start`
    *   **Plan**: Free

5.  **Environment Variables** (Wajib Diisi):
    *   `DATABASE_URL`: *(Connection string dari Supabase tadi, tambahkan `?pgbouncer=true` di ujungnya jika disarankan, atau gunakan connection string standar)*.
    *   `JWT_SECRET`: *(Buat string acak yang panjang dan aman)*.
    *   `CLIENT_URL`: `https://invoice-flow-client.vercel.app` *(Nanti kita update setelah deploy frontend, untuk sementara isi `*` atau kosongkan)*.
    *   `NODE_ENV`: `production`

6.  Klik **Create Web Service**. Tunggu sampai deploy selesai.
7.  Salin **URL Backend** Anda (misalnya: `https://invoice-api.onrender.com`).

---

## Langkah 3: Setup Frontend (Vercel)

1.  Buka [Vercel.com](https://vercel.com) dan buat akun.
2.  Klik **Add New...** -> **Project**.
3.  Import repository GitHub Anda.
4.  Konfigurasi Project:
    *   **Framework Preset**: Vite
    *   **Root Directory**: Klik `Edit` dan pilih folder `client`.
    *   **Environment Variables**:
        *   `VITE_API_URL`: *(Masukkan URL Backend dari Render tadi, tanpa slash di belakang, e.g. `https://invoice-api.onrender.com/api`)*. **PENTING: Tambahkan `/api` di ujung URL**.

5.  Klik **Deploy**.

---

## Langkah 4: Finalisasi (Menghubungkan Semuanya)

1.  Setelah Vercel selesai deploy, Anda akan dapat URL Frontend (misalnya `https://invoice-flow.vercel.app`).
2.  Kembali ke **Render Dashboard** -> pilih service backend Anda -> **Environment**.
3.  Update variable `CLIENT_URL` dengan URL Frontend dari Vercel tadi (misalnya `https://invoice-flow.vercel.app`).
4.  Update juga variable `DATABASE_URL` di **Supabase** atau render jika perlu migrasi schema:
    *   Karena kita tidak bisa menjalankan `npx prisma db push` dari lokal ke database production dengan mudah jika network berbeda, cara termudah adalah:
    *   Di lokal komputer Anda, ganti `DATABASE_URL` di file `.env` server sementara ke URL Supabase.
    *   Jalankan `npx prisma db push` dari terminal lokal Anda. Ini akan membuat tabel-tabel di Supabase.
    *   *(Jangan lupa kembalikan .env lokal ke database lokal setelah selesai)*.

---

## Rangkuman Environment Variables

### Backend (Render)
```env
DATABASE_URL="postgresql://postgres:pass@...supabase.co:5432/postgres"
JWT_SECRET="rahasia_super_aman_123"
# URL Frontend Vercel (tanpa slash di akhir)
CLIENT_URL="https://invoice-flow.vercel.app"
NODE_ENV="production"
```

### Frontend (Vercel)
```env
# URL Backend Render + /api
VITE_API_URL="https://invoice-api.onrender.com/api"
```

---

## Catatan Penting untuk Free Plan Render
Server backend di Render (Free Tier) akan "tidur" (sleep) jika tidak ada aktivitas selama 15 menit.
*   **Efeknya**: Request pertama kali setelah tidur akan loading agak lama (30-60 detik).
*   **Solusi**: Ini wajar untuk free plan. Untuk production serius, disarankan upgrade ke plan berbayar ($7/bulan) agar server selalu nyala.
