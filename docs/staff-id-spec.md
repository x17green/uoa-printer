# Staff ID Generation (8-character identifier)

The system generates a deterministic, 8-character `STAFF_ID` for each employee. The ID is derived from the employee's name and date of birth.

## Generation algorithm
1. Normalize names:
   - Uppercase all letters
   - Remove non-letter characters
   - Extract first 2 letters of first name (pad with `X` if missing)
   - Extract first 2 letters of last name (pad with `X` if missing)

2. Extract DOB portion:
   - Parse the DOB field and take the last 4 digits of YYYYMMDD
   - If DOB is missing, use `0000` (but this triggers a validation error)

3. Base identifier:
   - Concatenate: `first2 + last2 + dob4` (8 characters)

4. Collision handling:
   - If the generated ID is already used in the same upload, generate a new one using a deterministic hash-based suffix.
   - The algorithm is fully deterministic (same input always produces same output).

## Example
| Full Name | DOB | Generated ID |
| --------- | --- | ------------ |
| John Doe | 1990-01-23 | `JODO0123` |
| Jane Smith | 1985-12-05 | `JASM1205` |

## Requirements
- Every uploaded row **must include a DOB**.
- Missing DOB results in a validation error, and the record is flagged.
