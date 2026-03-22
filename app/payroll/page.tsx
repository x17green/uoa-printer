'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader, Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from '@heroui/react';

interface PayrollRunSummary {
  id: string;
  month: number;
  year: number;
  status: string;
  uploadedAt: string;
  processedAt: string | null;
  notes: string | null;
  recordCount: number;
}

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch('/api/payroll')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.error || 'Failed to load payroll runs');
          return;
        }
        setRuns(data.runs || []);
      })
      .catch((err) => {
        setError(err?.message || 'Unknown error');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRuns = runs.filter((run) => {
    const normalizedFilter = filterText.trim().toLowerCase();
    if (!normalizedFilter) return true;

    const period = `${run.month}/${run.year}`;
    const status = run.status.toLowerCase();
    const notes = (run.notes || '').toLowerCase();

    return (
      period.includes(normalizedFilter) ||
      status.includes(normalizedFilter) ||
      notes.includes(normalizedFilter)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-foreground">Payroll Runs</h1>
          <p className="mt-2 text-muted-foreground">View all processed payroll batches.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && (
          <Card>
            <CardBody className="flex items-center justify-center py-12">
              <Spinner label="Loading payroll runs..." />
            </CardBody>
          </Card>
        )}

        {error && (
          <Card>
            <CardHeader className="bg-danger text-danger-foreground">
              <div className="text-lg font-semibold">Error</div>
            </CardHeader>
            <CardBody>
              <p>{error}</p>
            </CardBody>
          </Card>
        )}

        {!loading && !error && (
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Payroll Runs</h2>
                <p className="text-sm text-muted-foreground">Click a run to view details and print payslips.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Search (month/year/status/notes)"
                  className="rounded border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Link href="/">
                  <Button variant="solid" size="sm">
                    Upload New Payroll
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              <Table>
                <TableHeader>
                  <TableColumn>Period</TableColumn>
                  <TableColumn>Records</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Uploaded</TableColumn>
                  <TableColumn>Processed</TableColumn>
                  <TableColumn>Notes</TableColumn>
                  <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        {new Date(run.year, run.month - 1).toLocaleString('default', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{run.recordCount}</TableCell>
                      <TableCell>{run.status}</TableCell>
                      <TableCell>
                        {new Date(run.uploadedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {run.processedAt ? new Date(run.processedAt).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>{run.notes || '—'}</TableCell>
                      <TableCell>
                        <Link href={`/payroll/${run.id}`}>
                          <Button size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}
      </main>
    </div>
  );
}
