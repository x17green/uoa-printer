import { NextRequest, NextResponse } from "next/server";
import { parsePayrollExcel } from "@/lib/excel-parser";
import prisma from "@/lib/prisma";

const DEDUCTION_KEYWORDS = [
  "ASUU",
  "NHF",
  "PAYE",
  "P.A.Y.E",
  "SALARY ADVANCE",
  "LOAN",
  "SCHOOL",
  "UTILITY",
  "BHIS",
  "NASU",
  "BSETF",
  "BURSARY",
  "CO-OPERATIVE",
];

const isDeduction = (name: string) => {
  const normalized = String(name || "").toUpperCase();
  return DEDUCTION_KEYWORDS.some((kw) => normalized.includes(kw));
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const month = parseInt(formData.get("month") as string);
    const year = parseInt(formData.get("year") as string);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid month or year" },
        { status: 400 },
      );
    }

    console.log(
      "[v0] Processing payroll file:",
      file.name,
      `for ${month}/${year}`,
    );

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Parse Excel file
    const parseResult = await parsePayrollExcel(uint8Array as any, month, year);

    const hasErrors = parseResult.errors.some((e) => e.severity === "ERROR");

    console.log("[v0] Parsed", parseResult.employees.length, "employees", "errors", parseResult.errors.length);

    // If there are no parsed employees, treat it as a hard failure.
    if (parseResult.employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No payroll rows found in the uploaded file.",
          errors: parseResult.errors,
          metadata: parseResult.metadata,
        },
        { status: 400 },
      );
    }

    const force = (formData.get("force") as string) === "true";

    // Check if payroll run already exists
    const existingRun = await prisma.payrollRun.findFirst({
      where: {
        month,
        year,
      },
    });

    if (existingRun && !force) {
      return NextResponse.json(
        {
          success: false,
          message: `Payroll run for ${month}/${year} already exists`,
          runId: existingRun.id,
        },
        { status: 409 },
      );
    }

    // Create a payroll run record immediately (we'll process the details in the background)
    if (existingRun) {
      // Remove the previous run so we can re-upload a corrected file
      await prisma.payrollRun.delete({
        where: { id: existingRun.id },
      });
    }

    let payrollRun;

    try {
      payrollRun = await prisma.payrollRun.create({
        data: {
          month,
          year,
          status: "PENDING",
          notes: `Uploaded from ${file.name}`,
          totalRecords: parseResult.employees.length,
        },
      });
    } catch (createError) {
      const errorData = createError as any;
      if (
        errorData?.code === "P2002" &&
        Array.isArray(errorData?.meta?.target) &&
        errorData.meta.target.includes("month") &&
        errorData.meta.target.includes("year")
      ) {
        const duplicatedRun = await prisma.payrollRun.findFirst({
          where: { month, year },
        });

        return NextResponse.json(
          {
            success: false,
            message: `Payroll run for ${month}/${year} already exists`,
            runId: duplicatedRun?.id,
          },
          { status: 409 },
        );
      }

      throw createError;
    }

    // Process the payroll run in the background so the request returns quickly
    void (async () => {
      try {
        // Ensure employees exist
        const employeeRecords = parseResult.employees.map((emp) => {
          const [firstName, ...rest] = emp.fullName.split(" ");
          const lastName = rest.length > 0 ? rest.slice(-1)[0] : "";
          return {
            staffNumber: emp.staffNumber,
            firstName: firstName ?? "",
            lastName: lastName ?? "",
            department: emp.department ?? "",
            position: emp.staffType,
            salary: emp.basicSalary ?? 0,
          };
        });

        await prisma.employee.createMany({
          data: employeeRecords,
          skipDuplicates: true,
        });

        const employees = await prisma.employee.findMany({
          where: {
            staffNumber: {
              in: Array.from(new Set(parseResult.employees.map((e) => e.staffNumber))),
            },
          },
        });
        const employeeByNumber = new Map(employees.map((e) => [e.staffNumber, e]));

        // Ensure payroll components exist
        const componentKeys = new Set<string>();
        const componentDefinitions: { name: string; type: string }[] = [];
        parseResult.employees.forEach((emp) => {
          for (const name of Object.keys(emp.components)) {
            const key = `${name}::${isDeduction(name) ? "DEDUCTION" : "INCOME"}`;
            if (!componentKeys.has(key)) {
              componentKeys.add(key);
              componentDefinitions.push({
                name,
                type: isDeduction(name) ? "DEDUCTION" : "INCOME",
              });
            }
          }
        });

        await prisma.payrollComponent.createMany({
          data: componentDefinitions,
          skipDuplicates: true,
        });

        const components = await prisma.payrollComponent.findMany({
          where: {
            OR: componentDefinitions.map((c) => ({ name: c.name, type: c.type })),
          },
        });
        const componentByKey = new Map(
          components.map((c) => [`${c.name}::${c.type}`, c]),
        );

        // Create payroll records in batches (fast) and then attach components.
        const recordPayloads = parseResult.employees
          .map((emp) => {
            const employee = employeeByNumber.get(emp.staffNumber);
            if (!employee) return null;

            const basicSalary = Number(
              emp.basicSalary ?? emp.components["Basic Salary"] ?? 0,
            );
            const grossPay = Number(emp.grossPay ?? emp.components["Gross Pay"] ?? 0);

            const totalDeductions =
              typeof emp.totalDeductions === "number"
                ? Number(emp.totalDeductions)
                : Object.entries(emp.components)
                    .filter(([key]) => isDeduction(key))
                    .reduce((sum, [, value]) => sum + Number(value), 0);

            const netPayValue = Number(emp.netPay ?? 0);
            const netPay = netPayValue === 0 ? grossPay - totalDeductions : netPayValue;

            return {
              payrollRunId: payrollRun.id,
              employeeId: employee.id,
              basicSalary,
              grossEarnings: grossPay,
              totalDeductions,
              netPay,
              taxableIncome: grossPay - totalDeductions,
              incomeTax: 0,
              pensionContribution: 0,
              status: hasErrors ? "FAILED" : "COMPLETED",
            };
          })
          .filter(Boolean) as Array<{
          payrollRunId: number;
          employeeId: number;
          basicSalary: number;
          grossEarnings: number;
          totalDeductions: number;
          netPay: number;
          taxableIncome: number;
          incomeTax: number;
          pensionContribution: number;
          status: string;
        }>;

        let processedCount = 0;
        const CHUNK = 200;
        for (let i = 0; i < recordPayloads.length; i += CHUNK) {
          const chunk = recordPayloads.slice(i, i + CHUNK);
          const result = await prisma.payrollRecord.createMany({
            data: chunk,
            skipDuplicates: true,
          });

          // Update progress so the UI can show a progress bar.
          processedCount += result.count ?? 0;
          try {
            await prisma.payrollRun.update({
              where: { id: payrollRun.id },
              data: { processedRecords: processedCount },
            });
          } catch (updateErr) {
            // Ignore if the run no longer exists (e.g., deleted by user)
            console.warn(
              "[v0] Failed to update processedRecords (run may have been deleted):",
              updateErr,
            );
          }
        }

        // Fetch the records we just created so we can insert components against them.
        const createdRecords = await prisma.payrollRecord.findMany({
          where: { payrollRunId: payrollRun.id },
        });
        const recordByEmployeeId = new Map(
          createdRecords.map((r) => [r.employeeId, r]),
        );

        const componentRows: Array<{ payrollRecordId: number; componentId: number; amount: number }> = [];
        for (const emp of parseResult.employees) {
          const employee = employeeByNumber.get(emp.staffNumber);
          const record = employee ? recordByEmployeeId.get(employee.id) : undefined;
          if (!record) continue;

          for (const [name, amount] of Object.entries(emp.components)) {
            const type = isDeduction(name) ? "DEDUCTION" : "INCOME";
            const component = componentByKey.get(`${name}::${type}`);
            if (!component) continue;

            componentRows.push({
              payrollRecordId: record.id,
              componentId: component.id,
              amount: Number(amount),
            });
          }
        }

        for (let i = 0; i < componentRows.length; i += CHUNK) {
          await prisma.payrollRecordComponent.createMany({
            data: componentRows.slice(i, i + CHUNK),
            skipDuplicates: true,
          });
        }

        // Persist validation errors
        if (parseResult.errors.length > 0) {
          await prisma.validationError.createMany({
            data: parseResult.errors.map((error) => ({
              payrollRunId: payrollRun.id,
              type: error.type,
              staffNumber: error.staffNumber,
              message: error.message,
              severity: error.severity,
            })),
          });
        }

        // Mark run complete
        await prisma.payrollRun.update({
          where: { id: payrollRun.id },
          data: {
            status: hasErrors ? "FAILED" : "COMPLETED",
            processedRecords: parseResult.employees.length,
            errorRecords: parseResult.errors.filter((e) => e.severity === "ERROR").length,
          },
        });
      } catch (backgroundError) {
        console.error("[v0] Background processing error:", backgroundError);
        try {
          await prisma.payrollRun.updateMany({
            where: { id: payrollRun.id },
            data: {
              status: "FAILED",
            },
          });
        } catch (err) {
          // Ignore if the run was deleted between upload and background work.
          console.warn("[v0] Failed to mark run as FAILED (may have been deleted):", err);
        }
      }
    })();

    return NextResponse.json(
      {
        success: !hasErrors,
        message: hasErrors
          ? "Payroll processed with validation issues"
          : "Payroll file processed successfully",
        runId: payrollRun.id,
        totalRecords: parseResult.employees.length,
        errors: parseResult.errors,
        metadata: parseResult.metadata,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[v0] Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
