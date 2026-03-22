# Validation Rules

The parser validates each payroll row and records any issues as `ValidationError`.

## Validation error categories

### `MISSING_STAFF`
- Triggered when the staff name field is empty.
- Severity: `ERROR`

### `MISSING_DOB`
- Triggered when the DOB field is missing or empty.
- Severity: `ERROR`

### `CALCULATION_MISMATCH`
- Triggered when the computed net pay (gross - total deductions) differs from the Excel `NET PAY` value by more than 0.01.
- Severity: `WARNING`

### `INVALID_NUMBER`
- Triggered when a numeric field cannot be parsed as a number.
- Severity: `ERROR`

### `DUPLICATE_ID`
- Triggered when the staff identifier collision cannot be resolved deterministically.
- Severity: `ERROR`

## Import behavior
- If any `ERROR`-level validations exist, the payroll run will be marked as `FAILED` (by status) but still persisted.
- All validation errors are saved in the `ValidationError` table for review.

## UI behavior
- The dashboard will show the total number of errors/warnings and list them for user correction.
- Errors are not blocked from being stored (so users can fix and re-upload), but they must be addressed to ensure data integrity.
