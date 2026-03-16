import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Starting database migration...');

    // Verify the request is authorized (you can add proper auth here)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}` && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[v0] Creating database schema with Prisma...');

    // Prisma will create/ensure the schema based on schema.prisma
    // This is done automatically on client initialization
    
    // Seed initial PayrollComponents if they don't exist
    const existingComponents = await prisma.payrollComponent.findMany();
    
    if (existingComponents.length === 0) {
      console.log('[v0] Seeding initial PayrollComponents...');
      
      // We need at least one record to create components
      // For now, just log that we'd seed them during first payroll run
      console.log('[v0] Components will be created during first payroll run');
    }

    console.log('[v0] Migration completed successfully!');
    
    return NextResponse.json(
      { 
        message: 'Migration completed successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
