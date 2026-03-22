'use client';

import { Card, CardBody, CardHeader, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import type { ValidationError } from '@/lib/excel-parser';

interface ValidationResultsProps {
  errors: ValidationError[];
  totalRecords: number;
}

export function ValidationResults({ errors, totalRecords }: ValidationResultsProps) {
  if (!errors || errors.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex gap-3 bg-green-600 text-white">
          <div className="flex flex-col">
            <p className="text-lg font-semibold">Validation Passed</p>
            <p className="text-sm opacity-90">{totalRecords} records ready for processing</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-foreground font-semibold">All records are valid</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const errorCount = errors.filter((e) => e.severity === 'ERROR').length;
  const warningCount = errors.filter((e) => e.severity === 'WARNING').length;

  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3 bg-yellow-600 text-white">
        <div className="flex flex-col flex-1">
          <p className="text-lg font-semibold">Validation Results</p>
          <p className="text-sm opacity-90">
            {errorCount} errors, {warningCount} warnings
          </p>
        </div>
        <div className="flex gap-2">
          {errorCount > 0 && <Chip color="danger" size="sm">{errorCount} Errors</Chip>}
          {warningCount > 0 && <Chip color="warning" size="sm">{warningCount} Warnings</Chip>}
        </div>
      </CardHeader>
      <CardBody>
        <Table aria-label="Validation errors">
          <TableHeader>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>SHEET / ROW</TableColumn>
            <TableColumn>STAFF</TableColumn>
            <TableColumn>MESSAGE</TableColumn>
            <TableColumn>SEVERITY</TableColumn>
          </TableHeader>
          <TableBody>
            {errors.map((error, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <span className="text-xs font-mono">{error.type}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">
                      {error.sheet || "-"} / {error.row ?? "-"}
                    </p>
                    {error.column && (
                      <p className="text-xs text-muted-foreground">{error.column}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{error.staffNumber || '—'}</p>
                    <p className="text-xs text-muted-foreground">{error.staffName || '—'}</p>
                  </div>
                </TableCell>
                <TableCell>{error.message}</TableCell>
                <TableCell>
                  <Chip
                    color={error.severity === 'ERROR' ? 'danger' : 'warning'}
                    size="sm"
                    variant="flat"
                  >
                    {error.severity}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
