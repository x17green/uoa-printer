import { NextRequest, NextResponse } from 'next/server';
import { parsePayrollExcel } from '@/lib/excel-parser';
import prisma from '@/lib/prisma';

const Prisma = prisma

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    console.log('[v0] Processing payroll file:', file.name, `for ${month}/${year}`);

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Parse Excel file
    const parseResult = await parsePayrollExcel(uint8Array as any, month, year);

    if (!parseResult.success && parseResult.errors.some((e) => e.severity === 'ERROR')) {
      return NextResponse.json(
        {
          success: false,
          message: 'File parsing failed',
          errors: parseResult.errors,
          metadata: parseResult.metadata,
        },
        { status: 400 }
      );
    }

    console.log('[v0] Parsed', parseResult.employees.length, 'employees');

    // Check if payroll run already exists
    const existingRun = await prisma.payrollRun.findUnique({
      where: {
        month_year: {
          month,
          year,
        },
      },
    });

    if (existingRun) {
      return NextResponse.json(
        {
          success: false,
          message: `Payroll run for ${month}/${year} already exists`,
          runId: existingRun.id
        },
        { status: 409 }
      );
    }

    // Create payroll run and records in a transaction
    const payrollRun = await prisma.$transaction(async (tx) => {
      // Create payroll run
      const run = await tx.payrollRun.create({
        data: {
          month,
          year,
          status: 'PROCESSING',
          notes: `Uploaded from ${file.name}`,
          records: {
            create: await Promise.all(
              parseResult.employees.map(async (emp) => {
                // Get or create employee
                let employee = await tx.employee.findUnique({
                  where: { staffNumber: emp.staffNumber },
                });

                if (!employee) {
                  employee = await tx.employee.create({
                    data: {
                      staffNumber: emp.staffNumber,
                      fullName: emp.fullName,
                      department: emp.department,
                      staffType: emp.staffType,
                    },
                  });
                }

                // Calculate totals
                const basicSalary = new Prisma.Decimal(emp.components['Basic Salary'] || 0);
                const grossPay = new Prisma.Decimal(emp.components['Gross Pay'] || 0);

                const deductionSheets = [
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

                const totalDeductions = Object.entries(emp.components)
                  .filter(([key]) => deductionSheets.includes(key))
                  .reduce((sum, [, value]) => sum + value, 0);

                const netPay = grossPay.minus(new Prisma.Decimal(totalDeductions));

                return {
                  employee: {
                    connect: { id: employee.id },
                  },
                  basicSalary,
                  grossPay,
                  totalDeductions: new Prisma.Decimal(totalDeductions),
                  netPay,
                  components: {
                    create: Object.entries(emp.components).map(([name, amount]) => ({
                      name,
                      amount: new Prisma.Decimal(amount),
                      type: deductionSheets.includes(name) ? 'DEDUCTION' : 'INCOME',
                    })),
                  },
                };
              })
            ),
          },
        },
        include: {
          records: {
            include: {
              components: true,
            },
          },
        },
      });

      // Create validation errors
      if (parseResult.errors.length > 0) {
        await tx.validationError.createMany({
          data: parseResult.errors.map((error) => ({
            payrollRunId: run.id,
            errorType: error.type,
            staffNumber: error.staffNumber,
            staffName: error.staffName,
            message: error.message,
            severity: error.severity,
          })),
        });
      }

      // Update status to completed
      await tx.payrollRun.update({
        where: { id: run.id },
        data: {
          status: 'COMPLETED',
        },
      });

      return run;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Payroll file processed successfully',
        runId: payrollRun.id,
        totalRecords: parseResult.employees.length,
        errors: parseResult.errors,
        metadata: parseResult.metadata,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
