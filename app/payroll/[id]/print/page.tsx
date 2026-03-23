'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { PrintJobWizard } from '@/components/payroll/print-job-wizard';

interface PayoutRecord {
  id: string;
  employee: { staffNumber: string; fullName: string; department: string };
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  records: PayoutRecord[];
}

export default function PayrollRunPrintPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadRun() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/payroll/${params.id}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.payrollRun) {
          setError(data.error || 'Payroll run could not be loaded');
          return;
        }
        setRun(data.payrollRun);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    }

    loadRun();
  }, [params.id]);

  const handleSubmitJob = async (options: { mode: 'all' | 'single'; staffNumber?: string; format: 'pdf' | 'html'; template: string }) => {
    if (!run) return;

    const query = new URLSearchParams();
    query.append('format', options.format);
    if (options.mode === 'single' && options.staffNumber) {
      query.append('staffNumber', options.staffNumber);
    }

    const toastId = Math.random().toString(36).slice(2);

    try {
      const response = await fetch(`/api/payroll/${run.id}/print?${query.toString()}`);

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || 'Print service error');
      }

      if (options.format === 'pdf') {
        const blob = await response.blob();
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = `payslips-${run.month}-${run.year}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const text = await response.text();
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(text);
          win.document.close();
        } else {
          throw new Error('Pop-up blocked');
        }
      }

      toast({ title: 'Print job completed', description: 'Download complete or preview opened.', variant: 'default' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown print error';
      toast({ title: 'Print job failed', description: message, variant: 'destructive' });
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <div className="flex justify-center py-16"><Spinner /></div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <div className="p-6">
              <div className="text-xl font-bold">Print helper</div>
              <Alert variant="destructive">
                <div className="font-semibold">Error</div>
                <div>{error || 'Run not found'}</div>
              </Alert>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={() => router.push('/payroll')}>Back to runs</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const payrollPeriod = new Date(run.year, run.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-foreground">Print Workflow: {payrollPeriod}</h1>
          <p className="mt-2 text-muted-foreground">Use the wizard to define printing scope and submit your job safely.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PrintJobWizard
          payrollRunId={run.id.toString()}
          payrollPeriod={payrollPeriod}
          totalRecords={run.records.length}
          onSubmit={handleSubmitJob}
        />
      </main>
    </div>
  );
}
