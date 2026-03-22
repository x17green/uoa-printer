'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { ValidationError } from '@/lib/excel-parser';

interface ValidationErrorsModalProps {
  errors: ValidationError[];
  totalRecords: number;
}

export function ValidationErrorsModal({ errors, totalRecords }: ValidationErrorsModalProps) {
  const [open, setOpen] = useState(false);
  const [viewType, setViewType] = useState<'ERROR' | 'WARNING'>('ERROR');

  const errorCount = errors.filter((e) => e.severity === 'ERROR').length;
  const warningCount = errors.filter((e) => e.severity === 'WARNING').length;

  const filteredErrors = errors.filter((e) => e.severity === viewType);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2 bg-slate-100">
          <div>
            <p className="text-sm font-semibold">Validation Summary</p>
            <p className="text-xs text-muted-foreground">{totalRecords} records processed</p>
          </div>
          <div className="flex items-center gap-2">
            <Chip color="danger" size="sm">{errorCount} Errors</Chip>
            <Chip color="warning" size="sm">{warningCount} Warnings</Chip>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button color="secondary" size="sm">View detail report</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Validation Error Report</DialogTitle>
                  <DialogDescription>
                    {errorCount} errors and {warningCount} warnings found. Use tabs to switch.
                  </DialogDescription>
                </DialogHeader>

                <div className="px-2 py-3 border-b border-border flex gap-2">
                  <Button
                    size="sm"
                    color={viewType === 'ERROR' ? 'danger' : 'secondary'}
                    onPress={() => setViewType('ERROR')}
                  >
                    Errors ({errorCount})
                  </Button>
                  <Button
                    size="sm"
                    color={viewType === 'WARNING' ? 'warning' : 'secondary'}
                    onPress={() => setViewType('WARNING')}
                  >
                    Warnings ({warningCount})
                  </Button>
                </div>

                <div className="h-[calc(100%-10rem)] overflow-auto pt-2 px-2">
                  <Table aria-label="Validation errors" removeWrapper>
                    <TableHeader>
                      <TableColumn>TYPE</TableColumn>
                      <TableColumn>SHEET</TableColumn>
                      <TableColumn>ROW</TableColumn>
                      <TableColumn>STAFF NO</TableColumn>
                      <TableColumn>STAFF NAME</TableColumn>
                      <TableColumn>MESSAGE</TableColumn>
                      <TableColumn>SEVERITY</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {filteredErrors.map((error, idx) => (
                        <TableRow key={`${error.type}-${idx}`}>
                          <TableCell className="font-mono text-xs">{error.type}</TableCell>
                          <TableCell>{error.sheet || '-'}</TableCell>
                          <TableCell>{error.row ?? '-'}</TableCell>
                          <TableCell>{error.staffNumber || '-'}</TableCell>
                          <TableCell>{error.staffName || '-'}</TableCell>
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
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted-foreground">
            Validation details are grouped in a modal for easier review.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
