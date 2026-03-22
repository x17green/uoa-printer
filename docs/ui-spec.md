# UI Specification

This document describes the key pages and user flows for the payroll system.

## 1) Dashboard (Upload)
- URL: `/`
- Enables uploading an Excel file.
- Shows upload progress and validation error summary.
- Displays a summary table of the latest payroll run.

### Key Components
- **FileUploadZone**: drag & drop upload.
- **ValidationResults**: list of errors/warnings.
- **PayrollRecordsTable**: table listing parsed payroll records.
- **PrintDialog**: controls printing payslips.


## 2) Payroll Runs
- URL: `/payroll`
- Lists all payroll batches (month/year, record count, status).
- Allows navigating to a run details page.

## 3) Payroll Run Details
- URL: `/payroll/[id]`
- Shows run metadata, status, and validation errors.
- Shows a table of records with quick payslip preview links.

## 4) Payslip Preview
- URL: `/api/payroll/[id]/print?format=html&staffNumber=<id>`
- Produces a printable payslip for one employee or bulk.

### Payslip Design
- Header with University branding (green/gold theme).
- Employee details (name, department, staff ID).
- Two-column breakdown:
  - Earnings (allowances, basic, etc.)
  - Deductions (taxes, union dues, loans, etc.)
- Net Pay highlighted at end.


## Interaction Notes
- **Validation Errors**: Always displayed after upload, even if import succeeds.
- **Payslip generation**: Uses HTML print-friendly layout.
- **Record filtering**: Future improvements can add search/filter by name or staff ID.
