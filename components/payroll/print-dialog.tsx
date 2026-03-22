'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Radio,
  RadioGroup,
  Input,
} from '@heroui/react';

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRunId: string;
  onPrint: (staffNumber: string | null, format: 'html' | 'pdf') => void;
  totalRecords: number;
}

export function PrintDialog({
  isOpen,
  onClose,
  payrollRunId,
  onPrint,
  totalRecords,
}: PrintDialogProps) {
  const [printType, setPrintType] = useState<'all' | 'single'>('all');
  const [staffNumber, setStaffNumber] = useState('');
  const [format, setFormat] = useState<'html' | 'pdf'>('pdf');
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    setIsLoading(true);
    try {
      const selectedStaff = printType === 'all' ? null : staffNumber;
      await onPrint(selectedStaff, format);
      onClose();
    } catch (error) {
      console.error('Print action failed', error);
      // could use toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-2 bg-primary text-primary-foreground">
          <h2 className="text-2xl font-bold">Print Payslips</h2>
          <p className="text-sm text-primary-foreground/80">
            Choose delivery target and output style. PDF uses latest React PDF rendering.
          </p>
        </ModalHeader>

        <ModalBody className="grid gap-6 py-6">
          <div className="rounded-lg border border-border p-4 bg-slate-50">
            <p className="text-sm font-semibold mb-2">1. Select mode</p>
            <RadioGroup value={printType} onValueChange={(value) => setPrintType(value as 'all' | 'single')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Radio value="all" className="rounded-lg border p-3">
                  <p className="font-semibold">All Payslips</p>
                  <p className="text-xs text-muted-foreground">{totalRecords} records</p>
                </Radio>
                <Radio value="single" className="rounded-lg border p-3">
                  <p className="font-semibold">Single Payslip</p>
                  <p className="text-xs text-muted-foreground">One employee only</p>
                </Radio>
              </div>
            </RadioGroup>
          </div>

          {printType === 'single' && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-semibold mb-2">Employee Filter</p>
              <Input
                label="Staff Number"
                placeholder="e.g., ADJO0000"
                value={staffNumber}
                onValueChange={setStaffNumber}
                description="Use exact staff number to print one record"
              />
            </div>
          )}

          <div className="rounded-lg border border-border p-4 bg-slate-50">
            <p className="text-sm font-semibold mb-2">2. Choose output</p>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'html' | 'pdf')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Radio value="html" className="rounded-lg border p-3">
                  <p className="font-semibold">HTML</p>
                  <p className="text-xs text-muted-foreground">Preview then print from browser</p>
                </Radio>
                <Radio value="pdf" className="rounded-lg border p-3">
                  <p className="font-semibold">PDF (recommended)</p>
                  <p className="text-xs text-muted-foreground">Download generated PDF</p>
                </Radio>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold">3. Next action</p>
            <p className="text-xs text-muted-foreground">
              Press continue to generate the selected output. The job is processed in-memory.
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button color="default" variant="light" onPress={onClose} disabled={isLoading}>
            Close
          </Button>
          <Button
            color="primary"
            onPress={handlePrint}
            disabled={isLoading || (printType === 'single' && !staffNumber)}
            isLoading={isLoading}
          >
            {format === 'html' ? 'Open HTML Preview' : 'Download PDF'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
