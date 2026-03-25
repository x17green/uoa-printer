'use client';

import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PayrollRecord {
  id: string;
  employee: {
    staffNumber: string;
    fullName: string;
    department: string;
  };
  basicSalary: string;
  grossPay: string;
  totalDeductions: string;
  netPay: string;
  status: string;
}

interface PayrollRecordsTableProps {
  records: PayrollRecord[];
  onPayslipRequest?: (staffNumber: string) => void;
}

export function PayrollRecordsTable({ records, onPayslipRequest }: PayrollRecordsTableProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const pages = Math.ceil(records.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedRecords = records.slice(start, end);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3 bg-primary text-primary-foreground">
        <div className="flex flex-col">
          <p className="text-lg font-semibold">Payroll Records</p>
          <p className="text-sm opacity-90">{records.length} total records</p>
        </div>
      </CardHeader>
      <CardContent className="gap-4">
        <Table aria-label="Payroll records">
          <TableHeader>
            <TableRow>
              <TableHead>STAFF NUMBER</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead className="text-right">BASIC SALARY</TableHead>
              <TableHead className="text-right">GROSS PAY</TableHead>
              <TableHead className="text-right">DEDUCTIONS</TableHead>
              <TableHead className="text-right">NET PAY</TableHead>
              <TableHead>STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-mono text-sm">{record.employee.staffNumber}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{record.employee.fullName}</p>
                    <p className="text-sm text-muted-foreground">{record.employee.department}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(record.basicSalary)}</TableCell>
                <TableCell className="text-right text-success font-semibold">{formatCurrency(record.grossPay)}</TableCell>
                <TableCell className="text-right text-danger">{formatCurrency(record.totalDeductions)}</TableCell>
                <TableCell className="text-right font-bold text-primary">{formatCurrency(record.netPay)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {record.status}
                    </span>
                    {onPayslipRequest && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPayslipRequest(record.employee.staffNumber)}
                      >
                        Payslip
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
