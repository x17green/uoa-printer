import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.resolve(
      process.cwd(),
      "docs",
      "data",
      "PAYROLL_TEMPLATE_WITH_DOB_AND_CALCULATIONS.xlsx",
    );

    const buffer = await fs.readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=PAYROLL_TEMPLATE_WITH_DOB_AND_CALCULATIONS.xlsx",
      },
    });
  } catch (error) {
    console.error("[v0] Error downloading template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to download template" },
      { status: 500 },
    );
  }
}
