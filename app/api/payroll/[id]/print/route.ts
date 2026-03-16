import { NextRequest, NextResponse } from 'next/server';
import { generatePayslipHTML, generateBulkPayslipsHTML } from '@/lib/payslip-generator';
import prisma from '@/lib/prisma';
import type { PayslipData } from '@/lib/payslip-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html'; // html or pdf
    const staffNumber = searchParams.get('staffNumber'); // Optional: specific employee

    // Fetch payroll run with records and components
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        records: {
          where: staffNumber
            ? {
                employee: {
                  staffNumber,
                },
              }
            : undefined,
          include: {
            employee: true,
            components: true,
          },
        },
      },
    });

    if (!payrollRun) {
      return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
    }

    if (payrollRun.records.length === 0) {
      return NextResponse.json(
        { error: staffNumber ? 'Employee not found' : 'No records found' },
        { status: 404 }
      );
    }

    // Transform records to payslip data
    const payslips: PayslipData[] = payrollRun.records.map((record) => {
      const earnings = record.components
        .filter((c) => c.type === 'INCOME')
        .map((c) => ({
          name: c.name,
          amount: parseFloat(c.amount.toString()),
        }));

      const deductions = record.components
        .filter((c) => c.type === 'DEDUCTION')
        .map((c) => ({
          name: c.name,
          amount: parseFloat(c.amount.toString()),
        }));

      return {
        staffNumber: record.employee.staffNumber,
        fullName: record.employee.fullName,
        department: record.employee.department,
        position: `${record.employee.staffType} Staff`,
        month: payrollRun.month,
        year: payrollRun.year,
        basicSalary: parseFloat(record.basicSalary.toString()),
        grossPay: parseFloat(record.grossPay.toString()),
        earnings,
        deductions,
        totalDeductions: parseFloat(record.totalDeductions.toString()),
        netPay: parseFloat(record.netPay.toString()),
        bankName: record.employee.bankName || undefined,
        accountNumber: record.employee.accountNumber || undefined,
      };
    });

    if (format === 'pdf') {
      // For PDF generation, we'll return HTML that can be printed to PDF
      // In a production environment, you'd use a library like puppeteer or html2pdf
      const html = payslips.length === 1
        ? generatePayslipHTML(payslips[0])
        : generateBulkPayslipsHTML(payslips);

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="payslips-${payrollRun.month}-${payrollRun.year}.html"`,
        },
      });
    } else {
      // Return HTML
      const html = payslips.length === 1
        ? generatePayslipHTML(payslips[0])
        : generateBulkPayslipsHTML(payslips);

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
  } catch (error) {
    console.error('[v0] Print error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate payslips',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
