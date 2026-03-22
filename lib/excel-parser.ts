import * as XLSX from "xlsx";
import { generateStaffId } from "@/lib/staff-id";

export interface ParsedEmployee {
  staffNumber: string;
  fullName: string;
  department?: string;
  staffType: "ACADEMIC" | "NON_ACADEMIC";
  dob?: string;
  basicSalary: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  components: { [key: string]: number };
}

export interface ValidationError {
  type:
    | "MISSING_STAFF"
    | "MISSING_DOB"
    | "MISSING_SHEET"
    | "INVALID_NUMBER"
    | "CALCULATION_MISMATCH"
    | "DUPLICATE_ID";
  staffNumber?: string;
  staffName?: string;
  sheet?: string;
  message: string;
  severity: "ERROR" | "WARNING";
  row?: number;
  column?: string;
}

export interface ParseResult {
  success: boolean;
  employees: ParsedEmployee[];
  errors: ValidationError[];
  metadata: {
    month: number;
    year: number;
    totalRecords: number;
    sheetNames: string[];
  };
}

const MASTER_SHEETS = ["TEACHING STAFF", "NON TEACHING STAFF"];

const NAME_HEADERS = ["NAME OF STAFF", "NAMES OF STAFF"];
const DOB_HEADERS = ["DOB", "DATE OF BIRTH", "BIRTHDATE", "BIRTH DATE"];
const GROSS_HEADERS = ["GROSS PAY", "GROSS PAYBEFORE", "GROSSPAY"];
const DEDUCTION_HEADERS = ["TOTAL DEDUCTIONS", "TOT DEDUCT", "TOTAL DEDUCT"];
const NET_HEADERS = ["NET PAY", "NETPAY", "NET_PAY"];

const DEDUCTION_KEYWORDS = [
  "ASUU",
  "NHF",
  "P.A.Y.E",
  "PAYE",
  "SALARY ADVANCE",
  "LOAN",
  "SCHOOL FEES",
  "UTI",
  "UTILITY",
  "BHIS",
  "NASU",
  "BSETF",
  "BURSARY",
  "CO-OPERATIVE",
  "GARNISHMENT",
  "DEDUCTION",
];

function normalizeHeader(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim().toUpperCase();
}

function findHeaderIndex(row: any[], candidates: string[]): number | null {
  const normalized = row.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate.toUpperCase());
    if (idx >= 0) return idx;
  }
  return null;
}

function parseNumber(value: any): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}


function isDeductionHeader(header: string): boolean {
  const normalized = header.toUpperCase();
  return DEDUCTION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export async function parsePayrollExcel(
  buffer: Buffer,
  month: number,
  year: number,
): Promise<ParseResult> {
  const errors: ValidationError[] = [];
  const employees: ParsedEmployee[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames.map((s) => s.toUpperCase());

    const availableSheets = MASTER_SHEETS.filter((sheet) =>
      sheetNames.includes(sheet.toUpperCase()),
    );

    if (availableSheets.length === 0) {
      errors.push({
        type: "MISSING_SHEET",
        message: `Missing required sheets: ${MASTER_SHEETS.join(
          ", ",
        )}. Found: ${workbook.SheetNames.join(", ")}`,
        severity: "ERROR",
      });
      return {
        success: false,
        employees: [],
        errors,
        metadata: {
          month,
          year,
          totalRecords: 0,
          sheetNames: workbook.SheetNames,
        },
      };
    }

    const usedStaffIds = new Set<string>();

    const parseSheet = (sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
        raw: false,
      }) as any[][];

      if (rawRows.length === 0) return;

      // Find header row (first row containing "STAFF" and "NAME")
      let headerRowIndex = 0;
      for (let i = 0; i < rawRows.length; i += 1) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;
        const joined = row.map((c) => normalizeHeader(c)).join(" ");
        if (joined.includes("STAFF") && joined.includes("NAME")) {
          headerRowIndex = i;
          break;
        }
      }

      const headerRow = rawRows[headerRowIndex].map((c) => normalizeHeader(c));

      const nameCol =
        findHeaderIndex(headerRow, NAME_HEADERS) ??
        findHeaderIndex(headerRow, ["NAME"]);
      const dobCol = findHeaderIndex(headerRow, DOB_HEADERS);
      const departmentCol =
        findHeaderIndex(headerRow, ["DEPARTMENT"]) ??
        findHeaderIndex(headerRow, ["DEPT"]);
      const jobCol =
        findHeaderIndex(headerRow, ["JOB DESCRIPTION"]) ??
        findHeaderIndex(headerRow, ["POSITION"]);
      const gradeCol =
        findHeaderIndex(headerRow, ["GRADE/STEP"]) ??
        findHeaderIndex(headerRow, ["GRADE NAME"]) ??
        findHeaderIndex(headerRow, ["GRADE"]);
      const bankCol =
        findHeaderIndex(headerRow, ["BANK NAME"]) ??
        findHeaderIndex(headerRow, ["BANK"]);
      const acctCol =
        findHeaderIndex(headerRow, [
          "ACCT NO",
          "ACCOUNT NO",
          "ACCOUNT NUMBER",
        ]) ?? findHeaderIndex(headerRow, ["ACCOUNT NUMBE"]);

      const basicSalaryCol =
        findHeaderIndex(headerRow, ["NEW BASIC", "ANNUAL SALARY"]) ??
        findHeaderIndex(headerRow, ["BASIC SALARY"]);
      const grossCol = findHeaderIndex(headerRow, GROSS_HEADERS);
      const deductionCol = findHeaderIndex(headerRow, DEDUCTION_HEADERS);
      const netCol = findHeaderIndex(headerRow, NET_HEADERS);

      for (let r = headerRowIndex + 1; r < rawRows.length; r += 1) {
        const row = rawRows[r];
        if (!Array.isArray(row)) continue;

        // Skip entirely empty rows
        const rowFilled = row.some(
          (cell) =>
            cell !== null && cell !== undefined && String(cell).trim() !== "",
        );
        if (!rowFilled) continue;

        const name = nameCol !== null ? String(row[nameCol] || "").trim() : "";
        const dob = dobCol !== null ? String(row[dobCol] || "").trim() : "";
        const department =
          departmentCol !== null ? String(row[departmentCol] || "").trim() : "";
        const staffType = sheetName.toUpperCase().includes("TEACHING")
          ? "ACADEMIC"
          : "NON_ACADEMIC";

        if (!name) {
          errors.push({
            type: "MISSING_STAFF",
            message: `Missing staff name at row ${r + 1} in sheet "${sheetName}"`,
            severity: "ERROR",
            sheet: sheetName,
            row: r + 1,
          });
          continue;
        }

        if (!dob) {
          errors.push({
            type: "MISSING_DOB",
            staffName: name,
            message: `Missing DOB for staff "${name}" at row ${r + 1} in sheet "${sheetName}"`,
            severity: "ERROR",
            sheet: sheetName,
            row: r + 1,
          });
        }

        const staffNumber = generateStaffId(name, dob, usedStaffIds);

        const components: { [key: string]: number } = {};

        // Parse all columns as potential components (except known meta fields)
        for (let ci = 0; ci < headerRow.length; ci += 1) {
          const header = normalizeHeader(headerRow[ci]);
          if (!header) continue;

          // Skip meta columns
          if (
            [nameCol, dobCol, departmentCol, jobCol, gradeCol, bankCol, acctCol]
              .filter((x) => x !== null)
              .includes(ci)
          ) {
            continue;
          }
          if ([grossCol, deductionCol, netCol].includes(ci)) {
            continue;
          }

          const value = row[ci];
          const amount = parseNumber(value);
          if (amount === 0) continue;

          // classifying deduction vs income
          const isDeduction = isDeductionHeader(header);
          components[header] = amount;
        }

        const basicSalary =
          basicSalaryCol !== null ? parseNumber(row[basicSalaryCol]) : 0;
        const gross = grossCol !== null ? parseNumber(row[grossCol]) : 0;
        const totalDeductions =
          deductionCol !== null ? parseNumber(row[deductionCol]) : 0;
        const net = netCol !== null ? parseNumber(row[netCol]) : 0;

        const calcNet = gross - totalDeductions;
        const netDelta = net - calcNet;

        if (!Number.isNaN(netDelta) && Math.abs(netDelta) > 0.01) {
          errors.push({
            type: "CALCULATION_MISMATCH",
            staffNumber,
            staffName: name,
            message: `Net pay differs (expected ${net}, computed ${calcNet})`,
            severity: "WARNING",
            sheet: sheetName,
            row: r + 1,
            column: headerRow[netCol ?? -1] as string,
          });
        }

        employees.push({
          staffNumber,
          fullName: name,
          department,
          staffType,
          dob: dob || undefined,
          basicSalary,
          grossPay: gross,
          totalDeductions,
          netPay: net,
          components,
        });
      }
    };

    availableSheets.forEach(parseSheet);

    const success = errors.filter((e) => e.severity === "ERROR").length === 0;

    return {
      success,
      employees,
      errors,
      metadata: {
        month,
        year,
        totalRecords: employees.length,
        sheetNames: workbook.SheetNames,
      },
    };
  } catch (error) {
    errors.push({
      type: "MISSING_SHEET",
      message: `Failed to parse Excel: ${error instanceof Error ? error.message : "Unknown"}`,
      severity: "ERROR",
    });
    return {
      success: false,
      employees: [],
      errors,
      metadata: { month, year, totalRecords: 0, sheetNames: [] },
    };
  }
}
