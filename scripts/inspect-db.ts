import 'dotenv/config';
import { Client } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString });
  await client.connect();

  const tables = await client.query<{
    table_schema: string;
    table_name: string;
  }>(
    "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%payroll%';",
  );
  console.log('tables:', tables.rows);

  const columns = await client.query<{
    column_name: string;
    data_type: string;
  }>(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='PayrollRun' ORDER BY ordinal_position;",
  );
  console.log('PayrollRun columns:', columns.rows);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
