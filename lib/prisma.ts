/**
 * Prisma Client Instance
 * Singleton pattern for database connections
 * Integrates with Supabase PostgreSQL
 * 
 * Prisma v7 Pattern: Requires driver adapter
 * Single Source of Truth: All Prisma imports should come from this file
 */
import "dotenv/config"
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './prisma/client'

// Singleton pattern for Next.js (prevents multiple instances in dev mode)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize driver adapter (required in Prisma v7)
const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })

// Instantiate PrismaClient with adapter and logging
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

// Optional test-only instrumentation: increment an in-memory counter for every Prisma query
// Enabled when PRISMA_CAPTURE_QUERIES_FOR_TEST === 'true' (dev/test only)
if (process.env.PRISMA_CAPTURE_QUERIES_FOR_TEST === 'true') {
  // initialize counter
  (globalThis as any).__prismaTestQueryCount = 0;
  // Use prisma.$on('query') to count executed queries (works with `log: ['query']`)
  (prisma as any).$on('query', () => {
    try {
      (globalThis as any).__prismaTestQueryCount = ((globalThis as any).__prismaTestQueryCount || 0) + 1;
    } catch (_) {
      /* ignore */
    }
  });
}

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ✨ SINGLE SOURCE OF TRUTH: Re-export all Prisma types, enums, and utilities
export * from './prisma/client'

// Optional: Explicit exports for better IDE discoverability
export type {
  // Models

  // Prisma namespace for advanced types
  Prisma,
} from './prisma/client'

export {
  // Enums

} from './prisma/client'

export default prisma
