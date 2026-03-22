import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const runs = await prisma.payrollRun.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        _count: {
          select: { records: true },
        },
      },
    });

    const normalized = runs.map((run) => ({
      id: run.id,
      month: run.month,
      year: run.year,
      status: run.status,
      notes: run.notes,
      recordCount: run._count.records,
    }));

    return NextResponse.json({ success: true, runs: normalized });
  } catch (error) {
    console.error("[v0] Error fetching payroll runs", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payroll runs" }, { status: 500 });
  }
}
