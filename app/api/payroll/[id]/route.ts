import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        records: {
          include: {
            employee: true,
            components: true,
          },
        },
      },
    });

    if (!payrollRun) {
      return NextResponse.json(
        { error: 'Payroll run not found' },
        { status: 404 }
      );
    }

    // Get validation errors
    const validationErrors = await prisma.validationError.findMany({
      where: { payrollRunId: id },
    });

    return NextResponse.json({
      success: true,
      payrollRun,
      validationErrors,
    });
  } catch (error) {
    console.error('[v0] Error fetching payroll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll details' },
      { status: 500 }
    );
  }
}
