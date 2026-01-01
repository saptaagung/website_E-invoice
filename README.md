# InvoiceFlow - Sistem Faktur & Penawaran

Aplikasi web lengkap untuk mengelola faktur dan penawaran (quotation) dengan antarmuka modern dalam Bahasa Indonesia.

## 🏗️ Arsitektur Proyek

```
Webstie-Invoice/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Komponen UI yang dapat digunakan ulang
│   │   │   ├── ui/         # Komponen dasar (Button, Badge, Card, dll)
│   │   │   ├── Header.jsx  # Header dengan pencarian
│   │   │   ├── Sidebar.jsx # Navigasi sidebar
│   │   │   └── Layout.jsx  # Layout utama aplikasi
│   │   ├── context/        # React Context
│   │   │   └── AuthContext.jsx  # Autentikasi state
│   │   ├── lib/            # Utilitas & API
│   │   │   └── api.js      # Konfigurasi API client
│   │   ├── pages/          # Halaman-halaman
│   │   │   ├── Dashboard.jsx     # Dashboard utama
│   │   │   ├── Login.jsx         # Halaman login
│   │   │   ├── Register.jsx      # Halaman registrasi
│   │   │   ├── Documents.jsx     # Daftar dokumen
│   │   │   ├── Clients.jsx       # Manajemen klien
│   │   │   ├── InvoiceForm.jsx   # Form faktur/penawaran
│   │   │   ├── NewInvoiceSelector.jsx  # Pemilih pembuatan faktur
│   │   │   └── Settings.jsx      # Pengaturan perusahaan
│   │   ├── App.jsx         # Router & routes
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Tailwind CSS config
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Backend (Express + Prisma)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.js   # Prisma client instance
│   │   │   └── pdf.js      # Generator PDF (faktur & penawaran)
│   │   ├── middleware/
│   │   │   └── auth.js     # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js     # Autentikasi (login, register)
│   │   │   ├── clients.js  # CRUD klien
│   │   │   ├── invoices.js # CRUD faktur
│   │   │   ├── quotations.js # CRUD penawaran
│   │   │   └── settings.js # Pengaturan perusahaan
│   │   └── index.js        # Express server entry
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   └── .env.example
│
└── docker-compose.yml      # PostgreSQL database container
```

## 🛠️ Technology Stack

### Frontend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| React | 19.2 | Library UI |
| Vite | 7.2 | Build tool & dev server |
| Tailwind CSS | 4.1 | Utility-first CSS framework |
| React Router | 7.11 | Client-side routing |
| Lucide React | 0.562 | Icon library |

### Backend
| Teknologi | Versi | Deskripsi |
|-----------|-------|-----------|
| Node.js | 18+ | Runtime environment |
| Express | 4.18 | Web framework |
| Prisma | 6.0 | ORM & database toolkit |
| PostgreSQL | 15 | Database |
| JWT | 9.0 | Authentication tokens |
| PDFKit | 0.15 | PDF generation |
| bcryptjs | 2.4 | Password hashing |

## 📊 Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Client    │     │ CompanySettings │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ email       │     │ name        │     │ companyName │
│ password    │     │ contactName │     │ logo        │
│ name        │     │ email       │     │ bankAccounts│
│ role        │     │ phone       │     │ taxSettings │
└──────┬──────┘     │ address     │     └─────────────┘
       │            └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Invoice   │     │  Quotation  │     │     SPH     │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ invoiceNumber│    │ quotationNumber│  │ sphNumber   │
│ clientId (FK)│    │ clientId (FK)│   │ clientId (FK)│
│ userId (FK) │     │ userId (FK) │     │ userId (FK) │
│ subtotal    │     │ subtotal    │     │ subtotal    │
│ taxAmount   │     │ taxAmount   │     │ taxAmount   │
│ total       │     │ total       │     │ total       │
│ status      │     │ status      │     │ status      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ InvoiceItem │     │QuotationItem│     │   SPHItem   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ invoiceId(FK)│    │quotationId(FK)│   │ sphId (FK)  │
│ groupName   │     │ groupName   │     │ model       │
│ model       │     │ model       │     │ description │
│ description │     │ description │     │ quantity    │
│ quantity    │     │ quantity    │     │ rate        │
│ rate/amount │     │ rate/amount │     │ amount      │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** v18 atau lebih baru
- **Docker** (untuk database PostgreSQL)
- **npm** atau **yarn**

### 1. Clone & Setup

```bash
# Clone repository
git clone <repository-url>
cd Webstie-Invoice
```

### 2. Jalankan Database (PostgreSQL via Docker)

```bash
# Jalankan PostgreSQL container
docker-compose up -d

# Verifikasi container berjalan
docker ps
```

Ini akan menjalankan PostgreSQL di `localhost:5432` dengan:
- **User**: postgres
- **Password**: password
- **Database**: invoiceflow

### 3. Setup Backend Server

```bash
# Masuk ke folder server
cd server

# Install dependencies
npm install

# Salin file environment
cp .env.example .env

# Sesuaikan .env jika diperlukan (default sudah sesuai untuk development)

# Generate Prisma client
npm run db:generate

# Push schema ke database
npm run db:push

# Jalankan server development
npm run dev
```

Server akan berjalan di `http://localhost:3001`

### 4. Setup Frontend Client

```bash
# Buka terminal baru, masuk ke folder client
cd client

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### 5. Akses Aplikasi

Buka browser dan akses `http://localhost:5173`

## 📝 Environment Variables

### Server (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/invoiceflow?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Client URL (untuk CORS)
CLIENT_URL="http://localhost:5173"
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrasi user baru |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Clients
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/clients` | Daftar semua klien |
| GET | `/api/clients/:id` | Detail klien |
| POST | `/api/clients` | Buat klien baru |
| PUT | `/api/clients/:id` | Update klien |
| DELETE | `/api/clients/:id` | Hapus klien |

### Invoices (Faktur)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/invoices` | Daftar semua faktur |
| GET | `/api/invoices/:id` | Detail faktur |
| POST | `/api/invoices` | Buat faktur baru |
| PUT | `/api/invoices/:id` | Update faktur |
| DELETE | `/api/invoices/:id` | Hapus faktur |
| GET | `/api/invoices/:id/pdf` | Download PDF faktur |

### Quotations (Penawaran)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/quotations` | Daftar semua penawaran |
| GET | `/api/quotations/:id` | Detail penawaran |
| POST | `/api/quotations` | Buat penawaran baru |
| PUT | `/api/quotations/:id` | Update penawaran |
| DELETE | `/api/quotations/:id` | Hapus penawaran |
| GET | `/api/quotations/:id/pdf` | Download PDF penawaran |

### Settings
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/settings` | Get company settings |
| PUT | `/api/settings` | Update company settings |
| GET | `/api/settings/bank-accounts` | Daftar rekening bank |
| POST | `/api/settings/bank-accounts` | Tambah rekening bank |
| DELETE | `/api/settings/bank-accounts/:id` | Hapus rekening bank |

## ✨ Fitur Utama

### 📊 Dashboard
- Ringkasan KPI (draft, tagihan belum dibayar, menunggu respon)
- Status breakdown penawaran & faktur
- Daftar dokumen terbaru

### 📄 Manajemen Dokumen
- **Penawaran (Quotation)**: Buat, edit, kirim, terima/tolak
- **Faktur (Invoice)**: Buat dari penawaran atau standalone
- **PDF Generation**: Download PDF dengan format profesional

### 👥 Manajemen Klien
- CRUD klien dengan detail lengkap
- Filter dan pencarian
- Histori dokumen per klien

### ⚙️ Pengaturan
- **Profil Perusahaan**: Logo, nama, alamat, kontak
- **Detail Bank**: Multiple rekening bank
- **Pajak & Aturan**: PPN default, format penomoran
- **Tanda Tangan**: Upload gambar tanda tangan digital

### 🔐 Autentikasi
- Login/Register dengan JWT
- Protected routes
- Session management

## 📱 Responsivitas

Aplikasi ini fully responsive dengan:
- Mobile-first design
- Slide-out sidebar untuk mobile
- Tabel responsif dengan horizontal scroll
- Form yang adaptif

## 🌙 Dark Mode

Tema gelap sudah terimplementasi secara default dengan:
- Warna yang sesuai untuk mata
- Konsistensi visual di seluruh aplikasi

## 🔧 Development Scripts

### Server
```bash
npm run dev          # Jalankan dev server dengan nodemon
npm run start        # Jalankan production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema ke database
npm run db:migrate   # Run migrations
npm run db:studio    # Buka Prisma Studio
```

### Client
```bash
npm run dev      # Jalankan Vite dev server
npm run build    # Build untuk production
npm run preview  # Preview production build
npm run lint     # Jalankan ESLint
```

## 📦 Build untuk Production

### Frontend
```bash
cd client
npm run build
# Output di folder `dist/`
```

### Backend
```bash
cd server
npm run start
# Pastikan NODE_ENV=production di .env
```

## 🐳 Docker (Optional Full Stack)

Untuk menjalankan seluruh stack dengan Docker:

```bash
# Jalankan semua services
docker-compose up -d
```

---

**InvoiceFlow** - Dibuat dengan ❤️ untuk bisnis Indonesia
