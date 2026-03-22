import { promises as fs } from "fs";
import { parsePayrollExcel } from "../lib/excel-parser";

async function main() {
  const path = "./docs/data/PAYROL MOCK DATA FEBRUARY  MAIN SALARY,2026.xlsx";
  const buffer = await fs.readFile(path);
  const result = await parsePayrollExcel(buffer, 3, 2026);

  console.log("success:", result.success);
  console.log("employees:", result.employees.length);
  console.log("errors:", result.errors.length);
  console.log("metadata:", result.metadata);
  console.log("--- first record ---");
  console.log(JSON.stringify(result.employees[0], null, 2));

  console.log("--- first 20 errors ---");
  console.log(result.errors.slice(0, 20));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
