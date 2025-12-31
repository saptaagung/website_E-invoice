# InvoiceFlow - Invoice & Quotation Management System

A full-stack web application for creating and managing invoices, quotations, and SPH (Surat Penawaran Harga) documents. Built with modern technologies including React, Express.js, Prisma, and PostgreSQL.

![Status](https://img.shields.io/badge/status-development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up the Database](#2-set-up-the-database)
  - [3. Configure the Server](#3-configure-the-server)
  - [4. Configure the Client](#4-configure-the-client)
  - [5. Run the Application](#5-run-the-application)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

- **User Authentication** - Secure login and registration with JWT tokens
- **Client Management** - Add, edit, and manage customer/client information
- **Invoice Management** - Create, edit, and track invoices with multiple line items
- **Quotation Management** - Generate professional quotations for clients
- **SPH (Surat Penawaran Harga)** - Indonesian-style price offering letters
- **PDF Generation** - Export invoices and quotations as PDF documents
- **Dashboard** - Overview of business metrics and recent activities
- **Company Settings** - Customize company information, tax rates, and numbering formats
- **Bank Account Management** - Store and manage multiple bank accounts
- **Responsive Design** - Mobile-friendly interface

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| Vite | 7.2.4 | Build Tool |
| TailwindCSS | 4.1.18 | Styling |
| React Router | 7.11.0 | Routing |
| Lucide React | 0.562.0 | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.18.2 | API Framework |
| Prisma | 6.0.0 | ORM |
| PostgreSQL | 15+ | Database |
| JWT | 9.0.2 | Authentication |
| PDFKit | 0.15.0 | PDF Generation |
| bcryptjs | 2.4.3 | Password Hashing |

---

## 📦 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **Docker** & **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Webstie-Invoice
```

### 2. Set Up the Database

Start the PostgreSQL database using Docker Compose:

```bash
# Start PostgreSQL container in the background
docker-compose up -d

# Verify the container is running
docker ps
```

The database will be available at:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `invoiceflow`
- **Username**: `postgres`
- **Password**: `password`

### 3. Configure the Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file from example
cp .env.example .env
```

Edit the `.env` file if needed (default values should work for local development):

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/invoiceflow?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL="http://localhost:5173"
```

Set up the database schema:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Configure the Client

```bash
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install
```

### 5. Run the Application

You'll need two terminal windows to run both the server and client:

**Terminal 1 - Start the Server:**
```bash
cd server
npm run dev
```
Server will be running at: `http://localhost:3001`

**Terminal 2 - Start the Client:**
```bash
cd client
npm run dev
```
Client will be running at: `http://localhost:5173`

### 🎉 Access the Application

Open your browser and navigate to:
- **Application**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 📁 Project Structure

```
Webstie-Invoice/
├── client/                     # Frontend React application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── assets/            # Images and media
│   │   ├── components/        # Reusable React components
│   │   │   ├── Header.jsx     # App header
│   │   │   ├── Layout.jsx     # Main layout wrapper
│   │   │   ├── Sidebar.jsx    # Navigation sidebar
│   │   │   └── ui/            # UI components
│   │   ├── pages/             # Page components
│   │   │   ├── Clients.jsx    # Client management
│   │   │   ├── Dashboard.jsx  # Main dashboard
│   │   │   ├── Documents.jsx  # Invoice/Quotation list
│   │   │   ├── InvoiceForm.jsx # Create/Edit forms
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Register.jsx   # Registration page
│   │   │   └── Settings.jsx   # App settings
│   │   ├── App.jsx            # Main App component
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Express application
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── routes/            # API routes
│   │   │   ├── auth.js        # Authentication routes
│   │   │   ├── clients.js     # Client CRUD routes
│   │   │   ├── invoices.js    # Invoice routes
│   │   │   ├── quotations.js  # Quotation routes
│   │   │   └── settings.js    # Settings routes
│   │   └── index.js           # Server entry point
│   ├── .env.example           # Environment template
│   └── package.json
│
├── docker-compose.yml          # Docker configuration
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create new client |
| GET | `/api/clients/:id` | Get client by ID |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all invoices |
| POST | `/api/invoices` | Create new invoice |
| GET | `/api/invoices/:id` | Get invoice by ID |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/api/invoices/:id/pdf` | Download invoice PDF |

### Quotations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quotations` | List all quotations |
| POST | `/api/quotations` | Create new quotation |
| GET | `/api/quotations/:id` | Get quotation by ID |
| PUT | `/api/quotations/:id` | Update quotation |
| DELETE | `/api/quotations/:id` | Delete quotation |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get company settings |
| PUT | `/api/settings` | Update company settings |
| GET | `/api/settings/bank-accounts` | List bank accounts |
| POST | `/api/settings/bank-accounts` | Add bank account |

---

## 🗄 Database Schema

The application uses the following main entities:

- **User** - Authentication and user management
- **Client** - Customer/client information
- **Invoice** - Invoice documents with line items
- **InvoiceItem** - Individual line items for invoices
- **Quotation** - Quotation documents with line items
- **QuotationItem** - Individual line items for quotations
- **SPH** - Surat Penawaran Harga (Price Offering Letter)
- **SPHItem** - Line items for SPH documents
- **CompanySettings** - Company configuration and numbering
- **BankAccount** - Bank account details
- **PaymentRecord** - Payment tracking for invoices

---

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/invoiceflow?schema=public` |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

---

## 📜 Available Scripts

### Server Scripts

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run start

# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Run database migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Client Scripts

```bash
# Development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Docker Commands

```bash
# Start database container
docker-compose up -d

# Stop database container
docker-compose down

# View container logs
docker logs invoiceflow-db

# Access PostgreSQL CLI
docker exec -it invoiceflow-db psql -U postgres -d invoiceflow
```

---

## 🔧 Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

1. Ensure Docker is running:
   ```bash
   docker ps
   ```
2. If the container is not running:
   ```bash
   docker-compose up -d
   ```
3. Wait a few seconds for PostgreSQL to initialize

### Port Already in Use

**Error**: `Port 3001 is already in use`

```bash
# Find and kill the process (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change the port in server/.env
PORT=3002
```

### Prisma Schema Out of Sync

If you see schema-related errors:

```bash
cd server
npm run db:push
npm run db:generate
```

### Client Cannot Connect to Server

1. Ensure the server is running on port 3001
2. Check CORS settings in `server/src/index.js`
3. Verify `CLIENT_URL` in `.env` matches your frontend URL

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Express.js](https://expressjs.com/)

---

**Made with ❤️ for efficient invoice management**
