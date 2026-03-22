# University of Africa Payroll Printing System (UAPPS)

A full-stack payroll import, validation, and payslip printing system.

- Next.js 16 (App Router)
- TypeScript
- Prisma + PostgreSQL (Supabase)
- Excel parser using `xlsx`
- PDF generation using `@react-pdf/renderer`
- UI components with `@heroui/react` / HeroUI

## Features

- Upload payroll Excel with multi-sheet parsing
- Validation error grouping/errors vs warnings modal
- Background batch processing with status polling
- Staff payroll record persistence (employees, components, runs)
- PDF + HTML payslip generation
- Branded University of African layout

## Getting started

1. Clone:
   ```bash
   git clone https://github.com/x17green/uoa-printer.git
   cd uoa-printer
   ```
2. Install:
   ```bash
   npm install
   ```
3. Set environment (`.env` from `.env.example`):
   - `DATABASE_URL` (Postgres)
   - `NEXTAUTH_URL` (if needed)
   - `SUPABASE_URL` / `SUPABASE_KEY` (optional)

4. Migrate:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
5. Run:
   ```bash
   npm run dev
   ```

## GitHub & Vercel link

- GitHub: https://github.com/x17green/uoa-printer
- Vercel project: `prj_ApbKwpWt9haJfMzJA0Kf17UGXLsH`

## Deploy to Vercel

1. `vercel login`
2. `vercel link --project prj_ApbKwpWt9haJfMzJA0Kf17UGXLsH`
3. `vercel --prod`

## Important routes

- `/api/payroll/upload` POST file upload
- `/api/payroll/{id}` GET payroll run with records/errors
- `/api/payroll/{id}/print?format=pdf` download PDF
- `/api/payroll/template` download blank template

## Local PDF generation

- `components/payroll/payslip-pdf.tsx` builds PDF document layout
- `app/api/payroll/[id]/print/route.ts` uses `renderToBuffer` for PDF

## Notes

- The parser is strict: missing DOB is a hard error.
- The UI includes a modal for grouped errors/warnings.
- Ensure the `public/logos/university_of_african_logo.png` is present for branding.
