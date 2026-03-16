This is a comprehensive **Product Development & Engineering Specification** for the **University of Africa Payroll Printing System (UAPPS)**. 

This document serves as the "source of truth" for building the monorepo. It combines your institutional requirements, the technical constraints of the Excel files, and the modern UI/UX philosophy discussed.

---

# 🎓 University of Africa: Payroll Printing System (UAPPS)
### **Product & Engineering Specification v1.0**

---

## 1. Brand Identity & Visual System
Based on the University of Africa logo, the interface will adhere to a **"Professional Conservative"** aesthetic.

| Element | Specification | Hex Code |
| :--- | :--- | :--- |
| **Primary Brand** | University Green | `#2F8F64` |
| **Accent/Gold** | Institutional Gold | `#F2C94C` |
| **Alert/Danger** | Academic Red | `#E63946` |
| **Background** | Soft Porcelain | `#F8FAFC` |
| **Typography** | Sans-Serif (Geist or Inter) | Clear, high-readability |
| **Icons** | HugeIcons (Stroke) | 1.5px weight for elegance |

**Design Rule:** The **60-30-10 Rule**. 60% White/Neutral space, 30% Primary Green (Headers/Buttons), 10% Gold/Red for accents and validation states.

---

## 2. Technical Stack (The Monorepo)
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Monorepo Tooling:** TurboRepo (Recommended for `web` and `packages/logic`)
*   **Database:** PostgreSQL via **Supabase**
*   **ORM:** **Prisma** (with Accelerate for connection pooling)
*   **UI Library:** **HeroUI** (formerly NextUI)
*   **Icons:** **HugeIcons**
*   **Excel Logic:** `xlsx` (SheetJS)
*   **PDF/Print:** CSS Media Queries + `@react-pdf/renderer`

---

## 3. Database Schema (Prisma)
The schema is designed to handle the **normalized** version of your 30+ sheet Excel workbook.

```prisma
// schema.prisma

enum StaffType {
  ACADEMIC
  NON_ACADEMIC
}

model Employee {
  id              String           @id @default(cuid())
  staffNumber     String           @unique
  fullName        String
  department      String
  staffType       StaffType
  bankName        String
  accountNumber   String
  records         PayrollRecord[]
}

model PayrollRun {
  id              String           @id @default(cuid())
  month           Int
  year            Int
  status          String           @default("draft") // draft, validated, approved
  uploadedBy      String
  totalGross      Decimal
  totalNet        Decimal
  records         PayrollRecord[]
  createdAt       DateTime         @default(now())
}

model PayrollRecord {
  id              String           @id @default(cuid())
  employeeId      String
  employee        Employee         @relation(fields: [employeeId], references: [id])
  payrollRunId    String
  payrollRun      PayrollRun       @relation(fields: [payrollRunId], references: [id])
  
  basicSalary     Decimal
  grossPay        Decimal
  totalDeductions Decimal
  netPay          Decimal
  
  components      PayrollComponent[] // Dynamic additions/subtractions
}

model PayrollComponent {
  id              String           @id @default(cuid())
  recordId        String
  record          PayrollRecord    @relation(fields: [recordId], references: [id])
  name            String           // e.g., "BHIS", "ASUU", "Hazard Allowance"
  amount          Decimal
  type            ComponentType    // INCOME or DEDUCTION
}

enum ComponentType {
  INCOME
  DEDUCTION
}
```

---

## 4. The "Intelligent Parser" Logic
Since deductions are scattered across 30+ sheets, the ingestion engine uses a **Map-Reduce Strategy**.

1.  **Phase 1: The Master Scan:** Identify "TEACHING STAFF" and "NON TEACHING STAFF" sheets. Create/Update Employee profiles.
2.  **Phase 2: Deduction Aggregation:** Iterate through all other sheets (ASUU, BHIS, NASU). 
    *   *Logic:* Find column "Staff Name" or "Staff ID" $\rightarrow$ Match to Employee $\rightarrow$ Add to `PayrollComponent` table as a `DEDUCTION`.
3.  **Phase 3: Reconciliation:** 
    *   System calculates: `Basic + Sum(Incomes) - Sum(Deductions)`.
    *   System compares with Excel's "Net Pay" column.
    *   If $\Delta > 0.01$, flag as **Validation Error**.

---

## 5. UI/UX Modules (HeroUI)

### A. The Bursar Dashboard
*   **Stat Cards:** High-level summary of Academic vs. Non-Academic wage bills.
*   **Action Hub:** A drag-and-drop zone for `.xlsx` files with a real-time progress bar.
*   **Validation Alert:** A sleek HeroUI `Card` showing a list of calculation mismatches found during parsing.

### B. Grouped Deduction Explorer
A "modernized" version of your 30 sheets. 
*   A sidebar listing all deduction types (e.g., ASUU, Pension). 
*   Clicking one shows a `Table` of all affected employees and the total amount to be remitted to that body.

### C. The Revamped Payslip (Print View)
The "finishing touch" for workers.
*   **Header:** University Crest (Left), "Monthly Pay Advice" (Center), Date (Right).
*   **Layout:** Two-column grid.
    *   **Left Column:** Earnings (Basic, Housing, etc.)
    *   **Right Column:** Deductions (Tax, Pension, Loans).
*   **Footer:** A "Net Pay" highlight box using **University Green** background and white bold text.
*   **Security:** A subtle QR code at the bottom for digital verification.

---

## 6. Development Roadmap

### Phase 1: Foundation (The Monorepo)
*   Initialize Next.js with TurboRepo.
*   Configure Prisma with Supabase.
*   Set up HeroUI and Tailwind with the University color palette.

### Phase 2: The Parser Engine
*   Build the `excel-parser` utility using `xlsx`.
*   Implement the logic to join the 30+ sheets into the unified Prisma model.

### Phase 3: Reporting & Validation UI
*   Build the "Validation Dashboard" to show the Bursar where Excel formulas might be broken.
*   Implement the "Deduction Groups" view.

### Phase 4: The Printing Engine
*   Develop the print-ready CSS template for the payslips.
*   Add "Bulk Print" functionality (print all academic staff in one click).

---

## 7. Meta-Cognitive Audit
*   **Scalability:** The system handles 2,000+ staff easily because processing happens in background jobs or optimized API routes.
*   **Integrity:** By re-calculating everything from "Atomic" values (Basic Salary), we solve the "Broken Excel Formula" problem that often plagues university bursaries.
*   **Professionalism:** Using HeroUI's `Skeleton` loaders and `AnimatePresence` ensures the app feels like a modern SaaS, not a legacy tool.

**Next Step:** I will now provide the **Prisma Schema** and the **Core Parsing Function** code to get the project started. Would you like me to start with the `schema.prisma` file or the `ExcelParser` service?