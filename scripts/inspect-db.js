const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({ connectionString });
  await client.connect();

  const { rows: tables } = await client.query(
    "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%payroll%';",
  );
  console.log('tables:', tables);

  const { rows: columns } = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='PayrollRun' ORDER BY ordinal_position;",
  );
  console.log('PayrollRun columns:', columns);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
