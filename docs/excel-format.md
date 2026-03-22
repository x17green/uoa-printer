# Excel Format (Master Upload Template)

## Sheets
The upload process only reads **two sheets** (master payroll sources):

- `TEACHING STAFF`
- `NON TEACHING STAFF`

All other sheets are considered reference/deduction breakdowns and are not parsed.

## Required Columns (per row)
| Column | Description |
| ------ | ----------- |
| `NAME OF STAFF` or `NAMES OF STAFF` | Full staff name (required) |
| `DOB` | Date of Birth (required for staff ID generation) |
| `DEPARTMENT` | Department / unit |
| `JOB DESCRIPTION` | Job title / role |
| `GRADE/STEP` / `GRADE NAME` | Grade or salary step |
| `BANK` / `BANK NAME` | Bank name |
| `ACCT NO` / `ACCOUNT NO` | Bank account number |
|
| `GROSS PAY` / `GROSS PAYBEFORE` | Gross pay |
| `TOTAL DEDUCTIONS` / `TOT DEDUCT` | Sum of deductions |
| `NET PAY` | Net pay after deductions |

## Component Columns (Incomes & Deductions)
All other numeric columns (except the required ones above) are treated as **components**, either:
- **INCOME** (allowances, bonuses, etc.)
- **DEDUCTION** (taxes, union dues, loans, etc.)

The parser uses keyword matching to classify components as deductions (e.g., ASUU, NHF, PAYE, LOAN, etc.).

## Template
A template file is generated and stored at:
- `docs/data/PAYROLL_TEMPLATE_WITH_DOB_AND_CALCULATIONS.xlsx`

This template includes the required `DOB` and `STAFF_ID` columns and validation columns such as `CALC_NET_FROM_GROSS` and `NET_DIFFERENCE`.
