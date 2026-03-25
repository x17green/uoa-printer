import React from 'react';
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from '@react-pdf/renderer';
import {
  generatePayslipHTML,
  generateBulkPayslipsHTML,
} from "@/lib/payslip-generator";
import { createPayslipPdfDocument } from '@/lib/payslip-pdf';
import prisma from "@/lib/prisma";
import type { PayslipData } from "@/lib/payslip-generator";
import type { DocumentProps } from '@react-pdf/renderer';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "html"; // html or pdf
    const staffNumber = searchParams.get("staffNumber"); // Optional: specific employee

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

    if (payrollRun.records.length === 0) {
      return NextResponse.json(
        { error: staffNumber ? "Employee not found" : "No records found" },
        { status: 404 },
      );
    }

    // Transform records to payslip data
    const payslips: PayslipData[] = payrollRun.records.map((record: any) => {
      const components = record.PayrollRecordComponent.map((row: any) => ({
        name: row.PayrollComponent.name,
        amount: parseFloat(row.amount.toString()),
        type: row.PayrollComponent.type as 'INCOME' | 'DEDUCTION',
      }));

      const earnings = components
        .filter((c: any) => c.type === 'INCOME')
        .map((c: any) => ({ name: c.name, amount: c.amount }));

      const deductions = components
        .filter((c: any) => c.type === 'DEDUCTION')
        .map((c: any) => ({ name: c.name, amount: c.amount }));

      const fullName = `${record.employee.firstName || ''} ${record.employee.lastName || ''}`.trim();
      const grossPay = record.grossEarnings ?? record.grossPay;

      return {
        staffNumber: record.employee.staffNumber,
        fullName: fullName || record.employee.fullName || '',
        department: record.employee.department,
        position: `${record.employee.staffType} Staff`,
        month: payrollRun.month,
        year: payrollRun.year,
        basicSalary: parseFloat(record.basicSalary?.toString() ?? '0'),
        grossPay: parseFloat(grossPay?.toString() ?? '0'),
        earnings,
        deductions,
        totalDeductions: parseFloat(record.totalDeductions?.toString() ?? '0'),
        netPay: parseFloat(record.netPay?.toString() ?? '0'),
        bankName: record.employee.bankName || undefined,
        accountNumber: record.employee.accountNumber || undefined,
      };
    });

    if (format === "pdf") {
      const pdfDocument = createPayslipPdfDocument(payslips);
      const pdfBuffer = await renderToBuffer(
        pdfDocument as React.ReactElement<DocumentProps>,
      );

      const body = new Uint8Array(pdfBuffer);

      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="payslips-${payrollRun.month}-${payrollRun.year}.pdf"`,
        },
      });
    } else {
      // Return HTML by fallback
      const html =
        payslips.length === 1
          ? generatePayslipHTML(payslips[0])
          : generateBulkPayslipsHTML(payslips);

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }
  } catch (error) {
    console.error("[v0] Print error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate payslips",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
