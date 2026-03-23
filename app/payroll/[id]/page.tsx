'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PayrollRecord {
  id: string;
  basicSalary: string;
  grossPay: string;
  totalDeductions: string;
  netPay: string;
  employee: {
    staffNumber: string;
    fullName: string;
    department: string;
  };
}

interface ValidationError {
  type: string;
  staffNumber?: string;
  staffName?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  records: PayrollRecord[];
}

export default function PayrollRunPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/payroll/${params.id}`)
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
  }, [params.id]);

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
              onClick={() => router.push(`/payroll/${run.id}/print`)}
            >
              Open Print Workflow
            </Button>
          </div>
        </div>

        {errors.length > 0 && (
          <Card>
            <CardHeader className="bg-yellow-600 text-white">
              <div className="text-lg font-semibold">Validation Issues</div>
              <div className="text-sm opacity-90">
                {errors.filter((e) => e.severity === 'ERROR').length} errors,{' '}
                {errors.filter((e) => e.severity === 'WARNING').length} warnings
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableColumn>Type</TableColumn>
                  <TableColumn>Staff</TableColumn>
                  <TableColumn>Message</TableColumn>
                  <TableColumn>Severity</TableColumn>
                </TableHeader>
                <TableBody>
                  {errors.map((err, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{err.type}</TableCell>
                      <TableCell>
                        {err.staffNumber || '—'}
                        <br />
                        <span className="text-xs text-muted-foreground">{err.staffName || ''}</span>
                      </TableCell>
                      <TableCell>{err.message}</TableCell>
                      <TableCell>
                        <span className={err.severity === 'ERROR' ? 'text-red-600' : 'text-orange-600'}>
                          {err.severity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">Records</div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableColumn>Staff</TableColumn>
                <TableColumn>Gross</TableColumn>
                <TableColumn>Deductions</TableColumn>
                <TableColumn>Net</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {run.records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{record.employee.staffNumber}</div>
                      <div>{record.employee.fullName}</div>
                      <div className="text-xs text-muted-foreground">{record.employee.department}</div>
                    </TableCell>
                    <TableCell className="text-right">{record.grossPay}</TableCell>
                    <TableCell className="text-right">{record.totalDeductions}</TableCell>
                    <TableCell className="text-right">{record.netPay}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/payroll/${run.id}/print?staffNumber=${record.employee.staffNumber}`)
                        }
                      >
                        Payslip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
