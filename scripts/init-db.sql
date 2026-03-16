-- Payroll Management System Database Schema
-- Created for University of Africa Payroll Printing System (UAPPS)

-- Create Employee table
CREATE TABLE IF NOT EXISTS "Employee" (
  id SERIAL PRIMARY KEY,
  "staffNumber" VARCHAR(50) NOT NULL UNIQUE,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  department VARCHAR(255),
  position VARCHAR(255),
  salary DECIMAL(15,2),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create PayrollRun table
CREATE TABLE IF NOT EXISTS "PayrollRun" (
  id SERIAL PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED
  "totalRecords" INTEGER DEFAULT 0,
  "processedRecords" INTEGER DEFAULT 0,
  "errorRecords" INTEGER DEFAULT 0,
  "fileUrl" VARCHAR(255),
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);

-- Create PayrollComponent table
CREATE TABLE IF NOT EXISTS "PayrollComponent" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- EARNINGS, DEDUCTION
  description TEXT,
  "sheetName" VARCHAR(255),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create PayrollRecord table
CREATE TABLE IF NOT EXISTS "PayrollRecord" (
  id SERIAL PRIMARY KEY,
  "payrollRunId" INTEGER NOT NULL REFERENCES "PayrollRun"(id) ON DELETE CASCADE,
  "employeeId" INTEGER NOT NULL REFERENCES "Employee"(id) ON DELETE CASCADE,
  "basicSalary" DECIMAL(15,2),
  "grossEarnings" DECIMAL(15,2) DEFAULT 0,
  "totalDeductions" DECIMAL(15,2) DEFAULT 0,
  "netPay" DECIMAL(15,2) DEFAULT 0,
  "taxableIncome" DECIMAL(15,2),
  "incomeTax" DECIMAL(15,2) DEFAULT 0,
  "pensionContribution" DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VALIDATED, PRINTED, REJECTED
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create PayrollRecordComponent junction table
CREATE TABLE IF NOT EXISTS "PayrollRecordComponent" (
  id SERIAL PRIMARY KEY,
  "payrollRecordId" INTEGER NOT NULL REFERENCES "PayrollRecord"(id) ON DELETE CASCADE,
  "componentId" INTEGER NOT NULL REFERENCES "PayrollComponent"(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("payrollRecordId", "componentId")
);

-- Create ValidationError table
CREATE TABLE IF NOT EXISTS "ValidationError" (
  id SERIAL PRIMARY KEY,
  "payrollRunId" INTEGER NOT NULL REFERENCES "PayrollRun"(id) ON DELETE CASCADE,
  "payrollRecordId" INTEGER REFERENCES "PayrollRecord"(id) ON DELETE CASCADE,
  "staffNumber" VARCHAR(50),
  type VARCHAR(50) NOT NULL, -- DUPLICATE, MISSING, INVALID_AMOUNT, MISMATCH, OTHER
  message TEXT NOT NULL,
  severity VARCHAR(50) DEFAULT 'WARNING', -- INFO, WARNING, ERROR
  "isResolved" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row-level security (RLS) on all tables
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollComponent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRecordComponent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ValidationError" ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_staffnumber ON "Employee"("staffNumber");
CREATE INDEX IF NOT EXISTS idx_payrollrun_month_year ON "PayrollRun"(month, year);
CREATE INDEX IF NOT EXISTS idx_payrollrecord_run ON "PayrollRecord"("payrollRunId");
CREATE INDEX IF NOT EXISTS idx_payrollrecord_employee ON "PayrollRecord"("employeeId");
CREATE INDEX IF NOT EXISTS idx_validationerror_run ON "ValidationError"("payrollRunId");
CREATE INDEX IF NOT EXISTS idx_validationerror_record ON "ValidationError"("payrollRecordId");

-- Seed some initial deduction components
INSERT INTO "PayrollComponent" (name, type, description, "sheetName", "isActive")
VALUES
  ('Basic Salary', 'EARNINGS', 'Monthly basic salary', 'Basic Salary', true),
  ('Housing Allowance', 'EARNINGS', 'Housing allowance', 'Housing Allowance', true),
  ('Transport Allowance', 'EARNINGS', 'Transport allowance', 'Transport Allowance', true),
  ('Medical Insurance', 'DEDUCTION', 'Medical insurance deduction', 'Medical Insurance', true),
  ('Pension Contribution', 'DEDUCTION', 'Pension fund contribution', 'Pension Contribution', true),
  ('Income Tax', 'DEDUCTION', 'Income tax withheld', 'Income Tax', true),
  ('Union Dues', 'DEDUCTION', 'Union membership dues', 'Union Dues', true),
  ('Loan Repayment', 'DEDUCTION', 'Staff loan repayment', 'Loan Repayment', true)
ON CONFLICT DO NOTHING;
