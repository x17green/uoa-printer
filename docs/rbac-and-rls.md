# RBAC and Row-Level Security (RLS)

This project uses Supabase/Postgres for data storage and enforces granular access control using RLS.

## Roles
- **Admin / Bursar**: Full access to upload, view, and print payroll data.
- **Payroll Officer**: Can upload payroll and view validation results.
- **Staff**: Can view only their own payslips.

## Database policies (recommended)

### Employees
- **Select**: allow if `auth.role = 'admin'` or `employee.staffNumber = auth.uid()` (or a mapped user field)

### PayrollRun
- **Select**: allow if `auth.role IN ('admin','payroll')` or if user is tied to the records in the run.

### PayrollRecord
- **Select**: allow if `auth.role IN ('admin','payroll')` OR if `employee.staffNumber = auth.uid()`

### ValidationError
- **Select**: allow if `auth.role IN ('admin','payroll')`.

> Note: `auth.uid()` in Supabase is the authenticated user ID; mapping between your user table and `staffNumber` may require an explicit link (e.g., `user.profile.staffNumber`).
