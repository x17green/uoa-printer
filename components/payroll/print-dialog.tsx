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
  const [format, setFormat] = useState<'html' | 'pdf'>('html');
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    setIsLoading(true);
    try {
      const selectedStaff = printType === 'all' ? null : staffNumber;
      await onPrint(selectedStaff, format);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 bg-primary text-primary-foreground">
          <h2>Print Payslips</h2>
        </ModalHeader>
        <ModalBody className="gap-6 py-6">
          {/* Print Type Selection */}
          <div>
            <p className="text-sm font-semibold mb-3 text-foreground">What would you like to print?</p>
            <RadioGroup value={printType} onValueChange={(value) => setPrintType(value as 'all' | 'single')}>
              <Radio value="all">
                <div>
                  <p className="font-medium">All Payslips</p>
                  <p className="text-sm text-muted-foreground">{totalRecords} records</p>
                </div>
              </Radio>
              <Radio value="single">
                <div>
                  <p className="font-medium">Single Employee</p>
                  <p className="text-sm text-muted-foreground">Specific staff member</p>
                </div>
              </Radio>
            </RadioGroup>
          </div>

          {/* Staff Number Input */}
          {printType === 'single' && (
            <Input
              label="Staff Number"
              placeholder="Enter staff number"
              value={staffNumber}
              onValueChange={setStaffNumber}
              description="e.g., STF001, ACAD042"
            />
          )}

          {/* Format Selection */}
          <div>
            <p className="text-sm font-semibold mb-3 text-foreground">Output Format</p>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'html' | 'pdf')}>
              <Radio value="html">
                <div>
                  <p className="font-medium">HTML (Print-Friendly)</p>
                  <p className="text-sm text-muted-foreground">Opens in browser, use Print dialog to save as PDF</p>
                </div>
              </Radio>
              <Radio value="pdf">
                <div>
                  <p className="font-medium">PDF Download</p>
                  <p className="text-sm text-muted-foreground">Direct PDF file download</p>
                </div>
              </Radio>
            </RadioGroup>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2">
          <Button color="default" variant="light" onPress={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handlePrint}
            disabled={isLoading || (printType === 'single' && !staffNumber)}
            isLoading={isLoading}
          >
            {format === 'html' ? 'View & Print' : 'Download PDF'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
