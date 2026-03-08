# Chen's — Business Website

Professional dark-themed business website built with Next.js 14, NextAuth.js, Prisma, and Neon PostgreSQL.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v5 (Credentials + Google OAuth)
- **Database**: PostgreSQL on Neon (via Prisma ORM)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

## Setup

### 1. Clone and install
```bash
git clone <repo>
cd chens
npm install
```

### 2. Environment variables
```bash
cp .env.example .env
```
Fill in `.env`:
- `DATABASE_URL` — from Neon dashboard
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` (dev) / your Vercel URL (prod)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console

### 3. Database setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Run dev server
```bash
npm run dev
```

## Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars in Vercel project settings
4. Deploy

## Make yourself admin
After registering, run in Neon SQL editor:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

## Pages
| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/signin` | Sign in (credentials + Google) |
| `/register` | Registration |
| `/dashboard` | User dashboard (protected) |
| `/admin` | Admin panel — user management (admin only) |
