'use client';

import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination } from '@heroui/react';
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
}

export function PayrollRecordsTable({ records }: PayrollRecordsTableProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const pages = Math.ceil(records.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedRecords = records.slice(start, end);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
      <CardBody className="gap-4">
        <Table aria-label="Payroll records" removeWrapper bottomContent={
          pages > 1 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                loop
                showControls
                page={page}
                total={pages}
                onChange={setPage}
              />
            </div>
          ) : null
        }>
          <TableHeader>
            <TableColumn>STAFF NUMBER</TableColumn>
            <TableColumn>NAME</TableColumn>
            <TableColumn className="text-right">BASIC SALARY</TableColumn>
            <TableColumn className="text-right">GROSS PAY</TableColumn>
            <TableColumn className="text-right">DEDUCTIONS</TableColumn>
            <TableColumn className="text-right">NET PAY</TableColumn>
            <TableColumn>STATUS</TableColumn>
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
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {record.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
