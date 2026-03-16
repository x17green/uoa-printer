'use client';

import { useState, useEffect } from 'react';
import { FileUploadZone } from '@/components/payroll/file-upload-zone';
import { ValidationResults } from '@/components/payroll/validation-results';
import { PayrollRecordsTable } from '@/components/payroll/payroll-records-table';
import { PrintDialog } from '@/components/payroll/print-dialog';
import { Card, CardBody, CardHeader, Spinner, Alert, Button, useDisclosure } from '@heroui/react';
import type { ValidationError } from '@/lib/excel-parser';

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  records: any[];
}

// interface ValidationError {
//   type: string;
//   staffNumber?: string;
//   staffName?: string;
//   message: string;
//   severity: 'ERROR' | 'WARNING';
// }

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const handleFileSelect = async (file: File, month: number, year: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', month.toString());
      formData.append('year', year.toString());

      const response = await fetch('/api/payroll/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Upload failed');
        setValidationErrors(data.errors || []);
        return;
      }

      // Fetch the payroll run details
      const runResponse = await fetch(`/api/payroll/${data.runId}`);
      const runData = await runResponse.json();

      setPayrollRun(runData.payrollRun);
      setValidationErrors(runData.validationErrors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async (staffNumber: string | null, format: 'html' | 'pdf') => {
    if (!payrollRun) return;

    const url = new URL(`/api/payroll/${payrollRun.id}/print`, window.location.origin);
    if (staffNumber) {
      url.searchParams.append('staffNumber', staffNumber);
    }
    url.searchParams.append('format', format);

    if (format === 'html') {
      window.open(url.toString(), '_blank');
    } else {
      // Download PDF
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `payslips-${payrollRun.month}-${payrollRun.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-foreground">Payroll Management System</h1>
          <p className="mt-2 text-muted-foreground">Upload and process monthly payroll data</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Upload Section */}
          <FileUploadZone onFileSelect={handleFileSelect} isLoading={isLoading} />

          {/* Error Message */}
          {error && (
            <Alert
              color="danger"
              title="Error"
              description={error}
              onClose={() => setError(null)}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardBody className="flex items-center justify-center py-12">
                <Spinner label="Processing payroll file..." />
              </CardBody>
            </Card>
          )}

          {/* Validation Results */}
          {payrollRun && validationErrors && (
            <ValidationResults
              errors={validationErrors}
              totalRecords={payrollRun.records.length}
            />
          )}

          {/* Payroll Records with Print Button */}
          {payrollRun && payrollRun.records && payrollRun.records.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button
                  color="primary"
                  onPress={onOpen}
                  className="gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h10a2 2 0 012 2v4a2 2 0 01-2 2zm-6-4a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  Print Payslips
                </Button>
              </div>
              <PayrollRecordsTable records={payrollRun.records} />
            </div>
          )}

          {/* Summary Stats */}
          {payrollRun && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardBody className="flex gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-3xl font-bold text-foreground">{payrollRun.records.length}</p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="flex gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-2xl font-bold text-primary capitalize">{payrollRun.status}</p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="flex gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Date(payrollRun.year, payrollRun.month - 1).toLocaleString('default', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="flex gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gross</p>
                    <p className="text-2xl font-bold text-success">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        notation: 'compact',
                        maximumFractionDigits: 1,
                      }).format(
                        payrollRun.records.reduce((sum, r) => sum + parseFloat(r.grossPay), 0)
                      )}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Print Dialog */}
      {payrollRun && (
        <PrintDialog
          isOpen={isOpen}
          onClose={onClose}
          payrollRunId={payrollRun.id}
          onPrint={handlePrint}
          totalRecords={payrollRun.records.length}
        />
      )}
    </div>
  );
}
