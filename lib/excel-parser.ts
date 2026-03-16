import * as XLSX from 'xlsx';
import { Decimal } from '@prisma/client/runtime/library';

export interface ParsedEmployee {
  staffNumber: string;
  fullName: string;
  department: string;
  staffType: 'ACADEMIC' | 'NON_ACADEMIC';
  components: { [key: string]: number };
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

export interface ValidationError {
  type: 'MISSING_STAFF' | 'MISSING_SHEET' | 'INVALID_AMOUNT' | 'DUPLICATE' | 'CALCULATION_MISMATCH';
  staffNumber?: string;
  staffName?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

const REQUIRED_SHEETS = [
  'Staff List',
  'Basic Salary',
  'Gross Pay',
];

const DEDUCTION_SHEETS = [
  'ASUU Deduction',
  'BHIS',
  'NECA',
  'Staff Loan',
  'Garnishment',
  'Tax Deduction',
  'Union Dues',
  'Health Insurance',
  'Pension Contribution',
  'Others',
];

export async function parsePayrollExcel(
  buffer: Buffer,
  month: number,
  year: number
): Promise<ParseResult> {
  const errors: ValidationError[] = [];
  const employees: ParsedEmployee[] = [];

  try {
    // Read workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    console.log('[v0] Excel file has sheets:', sheetNames);

    // Validate required sheets
    const missingSheets = REQUIRED_SHEETS.filter(
      (sheet) => !sheetNames.includes(sheet)
    );

    if (missingSheets.length > 0) {
      errors.push({
        type: 'MISSING_SHEET',
        message: `Missing required sheets: ${missingSheets.join(', ')}`,
        severity: 'ERROR',
      });
      return { success: false, employees: [], errors, metadata: { month, year, totalRecords: 0, sheetNames } };
    }

    // Parse Staff List
    const staffListSheet = workbook.Sheets['Staff List'];
    const staffData = XLSX.utils.sheet_to_json<any>(staffListSheet);

    if (!staffData || staffData.length === 0) {
      errors.push({
        type: 'MISSING_STAFF',
        message: 'Staff List sheet is empty',
        severity: 'ERROR',
      });
      return { success: false, employees: [], errors, metadata: { month, year, totalRecords: 0, sheetNames } };
    }

    // Create staff map
    const staffMap = new Map<string, any>();
    const staffNumbers = new Set<string>();

    staffData.forEach((staff: any, index: number) => {
      const staffNumber = String(staff['Staff Number'] || staff['staffNumber'] || '').trim();
      const fullName = String(staff['Full Name'] || staff['fullName'] || '').trim();
      const department = String(staff['Department'] || staff['department'] || '').trim();
      const staffType = String(staff['Staff Type'] || staff['staffType'] || 'NON_ACADEMIC').toUpperCase();

      if (!staffNumber) {
        errors.push({
          type: 'MISSING_STAFF',
          staffName: fullName,
          message: `Row ${index + 2}: Staff number is missing`,
          severity: 'ERROR',
        });
        return;
      }

      if (staffNumbers.has(staffNumber)) {
        errors.push({
          type: 'DUPLICATE',
          staffNumber,
          staffName: fullName,
          message: `Duplicate staff number: ${staffNumber}`,
          severity: 'ERROR',
        });
        return;
      }

      staffNumbers.add(staffNumber);
      staffMap.set(staffNumber, {
        staffNumber,
        fullName,
        department,
        staffType: staffType === 'ACADEMIC' ? 'ACADEMIC' : 'NON_ACADEMIC',
      });
    });

    // Parse earnings and deductions from each sheet
    const basicSalarySheet = workbook.Sheets['Basic Salary'];
    const basicSalaryData = XLSX.utils.sheet_to_json<any>(basicSalarySheet);

    const grossPaySheet = workbook.Sheets['Gross Pay'];
    const grossPayData = XLSX.utils.sheet_to_json<any>(grossPaySheet);

    // Build employee records with all components
    staffMap.forEach((staff) => {
      const components: { [key: string]: number } = {};

      // Get basic salary
      const basicSalaryRecord = basicSalaryData.find(
        (row: any) => String(row['Staff Number'] || row['staffNumber'] || '').trim() === staff.staffNumber
      );
      if (basicSalaryRecord) {
        components['Basic Salary'] = parseAmount(basicSalaryRecord['Amount'] || basicSalaryRecord['amount']);
      }

      // Get gross pay
      const grossPayRecord = grossPayData.find(
        (row: any) => String(row['Staff Number'] || row['staffNumber'] || '').trim() === staff.staffNumber
      );
      if (grossPayRecord) {
        components['Gross Pay'] = parseAmount(grossPayRecord['Amount'] || grossPayRecord['amount']);
      }

      // Get deductions from each sheet
      DEDUCTION_SHEETS.forEach((sheetName) => {
        if (sheetNames.includes(sheetName)) {
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json<any>(sheet);
          
          const record = data.find(
            (row: any) => String(row['Staff Number'] || row['staffNumber'] || '').trim() === staff.staffNumber
          );

          if (record) {
            const amount = parseAmount(record['Amount'] || record['amount']);
            if (amount > 0) {
              components[sheetName] = amount;
            }
          }
        }
      });

      // Calculate totals
      const basicSalary = components['Basic Salary'] || 0;
      const grossPay = components['Gross Pay'] || 0;
      const totalDeductions = Object.entries(components)
        .filter(([key]) => DEDUCTION_SHEETS.includes(key))
        .reduce((sum, [, value]) => sum + value, 0);

      // Validate calculations
      const expectedNetPay = grossPay - totalDeductions;
      
      // Add validation for income vs deduction balance
      if (grossPay > 0 && basicSalary > grossPay * 1.1) {
        errors.push({
          type: 'CALCULATION_MISMATCH',
          staffNumber: staff.staffNumber,
          staffName: staff.fullName,
          message: `Basic salary (${basicSalary}) exceeds gross pay (${grossPay})`,
          severity: 'WARNING',
        });
      }

      employees.push({
        ...staff,
        components,
      });
    });

    return {
      success: errors.filter((e) => e.severity === 'ERROR').length === 0,
      employees,
      errors,
      metadata: {
        month,
        year,
        totalRecords: employees.length,
        sheetNames,
      },
    };
  } catch (error) {
    console.error('[v0] Excel parsing error:', error);
    errors.push({
      type: 'MISSING_SHEET',
      message: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'ERROR',
    });
    return { success: false, employees: [], errors, metadata: { month, year, totalRecords: 0, sheetNames: [] } };
  }
}

function parseAmount(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}
