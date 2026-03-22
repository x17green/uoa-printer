import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await context.params;
  const id = Number(idParam);

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        records: {
          include: {
            employee: true,
            PayrollRecordComponent: {
              include: {
                PayrollComponent: true,
              },
            },
          },
        },
      },
    });

    if (!payrollRun) {
      return NextResponse.json(
        { error: "Payroll run not found" },
        { status: 404 },
      );
    }

    // Get validation errors
    const validationErrors = await prisma.validationError.findMany({
      where: { payrollRunId: id },
    });

    // Normalize payroll run record fields for client consumption.
    // Prisma uses Decimal objects for numeric fields, which aren't JSON-serializable.
    // Also provide a `fullName` aggregated from first/last name.
    const normalizedPayrollRun = {
      ...payrollRun,
      records: payrollRun.records.map((record) => ({
        id: record.id,
        status: record.status,
        basicSalary: record.basicSalary ? Number(record.basicSalary) : 0,
        grossPay: record.grossEarnings ? Number(record.grossEarnings) : 0,
        totalDeductions: record.totalDeductions ? Number(record.totalDeductions) : 0,
        netPay: record.netPay ? Number(record.netPay) : 0,
        employee: {
          staffNumber: record.employee.staffNumber,
          department: record.employee.department,
          fullName: `${record.employee.firstName || ''} ${record.employee.lastName || ''}`.trim(),
        },
      })),
    };

    return NextResponse.json({
      success: true,
      payrollRun: normalizedPayrollRun,
      validationErrors,
    });
  } catch (error) {
    console.error("[v0] Error fetching payroll:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll details" },
      { status: 500 },
    );
  }
}
