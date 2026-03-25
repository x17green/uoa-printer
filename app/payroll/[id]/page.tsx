'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ValidationErrorsModal } from '@/components/payroll/validation-errors-modal';
import { PayrollRecordsTable } from '@/components/payroll/payroll-records-table';
import type { ValidationError as ParserValidationError } from '@/lib/excel-parser';

interface PayrollRecord {
  id: string;
  basicSalary: string;
  grossPay: string;
  totalDeductions: string;
  netPay: string;
  status: string;
  employee: {
    staffNumber: string;
    fullName: string;
    department: string;
  };
}

type ValidationError = ParserValidationError;

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  records: PayrollRecord[];
}

export default function PayrollRunPage() {
  const router = useRouter();
  const params = useParams();
  const payrollId = params?.id;

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!payrollId) {
      setError('Payroll ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/payroll/${payrollId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.error || 'Failed to fetch payroll run');
          return;
        }
        setRun(data.payrollRun);
        setErrors(data.validationErrors || []);
      })
      .catch((err) => {
        setError(err?.message || 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, [payrollId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Spinner />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardHeader className="bg-danger text-danger-foreground">
              <div className="text-lg font-semibold">Error</div>
            </CardHeader>
            <CardContent>
              <p>{error || 'Payroll run not found'}</p>
              <Button className="mt-4" onClick={() => router.push('/payroll')}>
                Back to runs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const monthYear = new Date(run.year, run.month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-foreground">Payroll Run ({monthYear})</h1>
          <p className="mt-2 text-muted-foreground">Status: {run.status}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Records: {run.records.length}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/payroll">
              <Button size="sm">Back to runs</Button>
            </Link>
            <Button
              size="sm"
              onClick={() => router.push(`/payroll/${payrollId}/print`)}
              disabled={!payrollId}
            >
              Open Print Workflow
            </Button>
          </div>
        </div>

        {errors.length > 0 && (
          <ValidationErrorsModal errors={errors} totalRecords={run.records.length} />
        )}

        <PayrollRecordsTable
          records={run.records}
          onPayslipRequest={(staffNumber) => {
            if (!payrollId) return;
            router.push(`/payroll/${payrollId}/print?staffNumber=${encodeURIComponent(staffNumber)}`);
          }}
        />
      </main>
    </div>
  );
}
