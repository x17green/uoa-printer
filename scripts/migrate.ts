import { execSync } from 'child_process';
import { join } from 'path';

const projectRoot = process.cwd();
const prismaPath = join(projectRoot, 'prisma');

function runCommand(command: string, cwd: string): void {
  console.log(`[v0] Running: ${command} (cwd=${cwd})`);
  execSync(command, { stdio: 'inherit', cwd });
}

function main(): void {
  try {
    console.log('[v0] Starting Prisma migration script...');

    console.log('[v0] Generating Prisma client...');
    runCommand('prisma generate', projectRoot);

    console.log('[v0] Deploying Prisma migrations...');
    runCommand('prisma migrate deploy', projectRoot);

    console.log('[v0] Prisma migration script completed successfully!');
  } catch (error) {
    console.error('[v0] Prisma migration failed:', error);
    process.exit(1);
  }
}

main();
