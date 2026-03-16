import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

// Allow connecting to Supabase/Postgres instances that use a self-signed cert chain
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const DB_ENV_VARS = [
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
] as const;

function getDatabaseUrl(): string | undefined {
  for (const key of DB_ENV_VARS) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

async function runMigration(): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.error("[v0] No database URL found in environment.");
    console.error("[v0] Please set one of:", DB_ENV_VARS.join(", "));
    process.exit(1);
  }

  const sqlPath = join(process.cwd(), "scripts", "init-db.sql");

  let sql: string;
  try {
    sql = readFileSync(sqlPath, "utf8");
  } catch (err) {
    console.error("[v0] Failed to read migration SQL file:", sqlPath);
    console.error(err);
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    console.log("[v0] Connected to database.");
    console.log("[v0] Applying migration SQL...");
    await client.query(sql);
    console.log("[v0] Migration completed successfully!");
  } catch (err) {
    console.error("[v0] Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch((err) => {
  console.error("[v0] Unexpected error:", err);
  process.exit(1);
});
