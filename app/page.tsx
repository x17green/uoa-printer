'use client';

import { useState, useEffect } from 'react';
import { FileUploadZone } from '@/components/payroll/file-upload-zone';
import { ValidationErrorsModal } from '@/components/payroll/validation-errors-modal';
import { PayrollRecordsTable } from '@/components/payroll/payroll-records-table';
import { PrintDialog } from '@/components/payroll/print-dialog';
import { Card, CardBody, CardHeader, Spinner, Alert, Button, useDisclosure } from '@heroui/react';
import { Progress } from '@/components/ui/progress';
import type { ValidationError } from '@/lib/excel-parser';

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  totalRecords?: number;
  processedRecords?: number;
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
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [lastUpload, setLastUpload] = useState<
    | { file: File; month: number; year: number }
    | null
  >(null);
  const [existingRunId, setExistingRunId] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const totalRecords = payrollRun?.totalRecords ?? payrollRun?.records.length ?? 0;
  const processedRecords = payrollRun?.processedRecords ?? 0;
  const progressPercent =
    totalRecords > 0
      ? Math.min(100, Math.round((processedRecords / totalRecords) * 100))
      : 0;
  const isProcessing = payrollRun?.status === 'PENDING';

  const handleFileSelect = async (
    file: File,
    month: number,
    year: number,
    options?: { force?: boolean },
  ) => {
    setIsLoading(true);
    setError(null);
    setExistingRunId(null);
    setIsPolling(false);

    // Keep last-selected file in state so we can re-upload if needed
    setLastUpload({ file, month, year });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', month.toString());
      formData.append('year', year.toString());

      if (options?.force) {
        formData.append('force', 'true');
      }

      const response = await fetch('/api/payroll/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Upload failed');
        setValidationErrors(data.errors || []);

        if (response.status === 409 && data.runId) {
          setExistingRunId(data.runId);
        }

        return;
      }

      // Fetch the payroll run details
      const runResponse = await fetch(`/api/payroll/${data.runId}`);
      const runData = await runResponse.json();

      setPayrollRun(runData.payrollRun);
      setValidationErrors(runData.validationErrors || []);
      setIsPolling(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAnnotatedTemplate = async () => {
    if (!lastUpload || validationErrors.length === 0) return;

    setIsAnnotating(true);
    try {
      const XLSX = await import('xlsx');
      const buffer = await lastUpload.file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true });

      const normalize = (val: any) =>
        val === null || val === undefined ? '' : String(val).trim().toUpperCase();

      const findHeaderRow = (sheet: any) => {
        const range = XLSX.utils.decode_range(sheet['!ref'] || '');
        for (let r = range.s.r; r <= range.e.r; r += 1) {
          const row = [] as string[];
          for (let c = range.s.c; c <= range.e.c; c += 1) {
            const cell = sheet[XLSX.utils.encode_cell({ r, c })];
            row.push(normalize(cell?.v));
          }
          const joined = row.join(' ');
          if (joined.includes('STAFF') && joined.includes('NAME')) {
            return { index: r, headers: row };
          }
        }
        return null;
      };

      validationErrors.forEach((error) => {
        const desiredSheet = error.sheet || workbook.SheetNames[0];
        const sheetName =
          workbook.SheetNames.find(
            (s) => s.toUpperCase() === desiredSheet.toUpperCase(),
          ) ?? workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        const headerInfo = findHeaderRow(sheet);
        if (!headerInfo || !error.row || !error.column) return;

        const targetCol = headerInfo.headers.findIndex(
          (h) => h === normalize(error.column),
        );
        if (targetCol < 0) return;

        const address = XLSX.utils.encode_cell({
          r: error.row - 1,
          c: targetCol,
        });

        const cell = sheet[address] || { t: 's', v: '' };
        cell.s = {
          ...cell.s,
          fill: {
            patternType: 'solid',
            fgColor: { rgb: 'FFFFC0C0' },
          },
        };
        cell.c = [
          ...(cell.c || []),
          { t: 's', a: 'Validator', v: error.message },
        ];
        sheet[address] = cell;
      });

      const errorsSheet = XLSX.utils.aoa_to_sheet([
        ['Sheet', 'Row', 'Column', 'Message'],
        ...validationErrors.map((error) => [
          error.sheet ?? '',
          error.row ?? '',
          error.column ?? '',
          error.message,
        ]),
      ]);

      workbook.SheetNames.push('Validation Issues');
      workbook.Sheets['Validation Issues'] = errorsSheet;

      const out = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true,
      });

      const blob = new Blob([out], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-annotated-${lastUpload.month}-${lastUpload.year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate annotated template', err);
      setError('Failed to generate annotated template');
    } finally {
      setIsAnnotating(false);
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

  useEffect(() => {
    if (!payrollRun?.id || !isPolling) return;

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/payroll/${payrollRun.id}`);
      if (!response.ok) return;
      const data = await response.json();

      setPayrollRun(data.payrollRun);
      setValidationErrors(data.validationErrors || []);

      if (data.payrollRun?.status && data.payrollRun.status !== 'PENDING') {
        setIsPolling(false);
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [payrollRun?.id, isPolling]);

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

          {existingRunId && lastUpload && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                A payroll run already exists for this month/year. You can re-upload to replace the existing run.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  color="secondary"
                  onPress={() =>
                    handleFileSelect(lastUpload.file, lastUpload.month, lastUpload.year, {
                      force: true,
                    })
                  }
                  isLoading={isLoading}
                >
                  Overwrite existing run
                </Button>
                <Button
                  color="secondary"
                  onPress={() => setExistingRunId(null)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
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
            <ValidationErrorsModal
              errors={validationErrors}
              totalRecords={totalRecords}
            />
          )}

          {/* Payroll Records with Print Button */}
          {payrollRun && payrollRun.records && payrollRun.records.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-end gap-2">
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
                <Button
                  onPress={() => window.open('/api/payroll/template', '_blank')}
                  className="gap-2"
                >
                  Download Template
                </Button>
                <Button
                  color="secondary"
                  onPress={downloadAnnotatedTemplate}
                  isLoading={isAnnotating}
                  disabled={!lastUpload || validationErrors.length === 0}
                  className="gap-2"
                >
                  Download Annotated Template
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
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="text-lg font-semibold">{processedRecords} / {totalRecords}</p>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">{progressPercent}%</p>
                  </div>
                  <Progress value={progressPercent} />
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
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
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
