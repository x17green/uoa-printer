-- Supabase migration: Enable row-level security on all existing tables
-- Run this migration with `supabase db migrate` (or equivalent) to ensure
-- RLS is turned on for each table.

ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollComponent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRecordComponent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ValidationError" ENABLE ROW LEVEL SECURITY;
