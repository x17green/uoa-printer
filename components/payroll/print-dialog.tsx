'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-2xl font-bold">Print Payslips</h2>
          <p className="text-sm text-muted-foreground">
            Choose delivery target and output style. PDF generation is recommended.
          </p>
        </DialogHeader>

        <div className="space-y-6 p-4">
          <div className="rounded-lg border border-border p-4 bg-slate-50">
            <p className="text-sm font-semibold mb-2">1. Select mode</p>
            <RadioGroup value={printType} onValueChange={(value) => setPrintType(value as 'all' | 'single')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="rounded-lg border p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" />
                    <span className="font-semibold">All Payslips</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{totalRecords} records</p>
                </label>
                <label className="rounded-lg border p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="single" />
                    <span className="font-semibold">Single Payslip</span>
                  </div>
                  <p className="text-xs text-muted-foreground">One employee only</p>
                </label>
              </div>
            </RadioGroup>
          </div>

          {printType === 'single' && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-semibold mb-2">Employee Filter</p>
              <Input
                value={staffNumber}
                onChange={(e) => setStaffNumber(e.target.value)}
                placeholder="e.g., ADJO0000"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Use exact staff number to print one record</p>
            </div>
          )}

          <div className="rounded-lg border border-border p-4 bg-slate-50">
            <p className="text-sm font-semibold mb-2">2. Choose output</p>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'html' | 'pdf')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="rounded-lg border p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="html" />
                    <span className="font-semibold">HTML</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Preview then print from browser</p>
                </label>
                <label className="rounded-lg border p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="pdf" />
                    <span className="font-semibold">PDF (recommended)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Download generated file</p>
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-semibold">3. Next action</p>
            <p className="text-xs text-muted-foreground">
              Continue to generate selected output. This will close the dialog.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Close
          </Button>
          <Button variant="default" onClick={handlePrint} disabled={isLoading || (printType === 'single' && !staffNumber)}>
            {format === 'html' ? 'Open HTML Preview' : 'Download PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
