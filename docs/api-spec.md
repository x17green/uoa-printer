# API Specification

## `POST /api/payroll/upload`
Upload a payroll Excel file.

### Request
- FormData:
  - `file` (Excel file)
  - `month` (number)
  - `year` (number)
  - `force` (optional boolean string; set to `true` to overwrite an existing run for the same month/year)

### Response
- `200` / `201` success
```json
{
  "success": true,
  "message": "Payroll file processed successfully",
  "runId": "...",
  "totalRecords": 666,
  "errors": [/* validation errors */],
  "metadata": { /* month/year + sheetnames */ }
}
```

- `400` / `409` failure

When a run already exists, the response will be `409` and include the existing `runId`. You may re-upload with `force=true` to overwrite the existing run.

---

## `GET /api/payroll`
List all payroll runs.

### Response
```json
{
  "success": true,
  "runs": [
    {
      "id": "...",
      "month": 3,
      "year": 2026,
      "status": "COMPLETED",
      "uploadedAt": "...",
      "processedAt": "...",
      "notes": "Uploaded from ...",
      "recordCount": 666
    }
  ]
}
```

---

## `GET /api/payroll/[id]`
Get payroll run details and validation errors.

### Response
```json
{
  "success": true,
  "payrollRun": { /* payroll run + records */ },
  "validationErrors": [ /* ValidationError[] */ ]
}
```

---

## `GET /api/payroll/[id]/print?format=html|pdf&staffNumber=<id>`
Generate a payslip HTML or PDF for one or all employees.

### Response
- HTML page containing one or more payslip renderings.
