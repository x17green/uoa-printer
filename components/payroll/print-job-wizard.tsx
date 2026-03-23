'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface PrintJobWizardProps {
  payrollRunId: string;
  payrollPeriod: string;
  totalRecords: number;
  defaultStaffNumber?: string;
  onSubmit: (options: {
    mode: 'all' | 'single';
    staffNumber?: string;
    format: 'pdf' | 'html';
    template: string;
  }) => Promise<void>;
}

const templateOptions = ['Standard Payslip', 'Professional Payslip', 'Compact Payslip'];

export function PrintJobWizard({
  payrollRunId,
  payrollPeriod,
  totalRecords,
  defaultStaffNumber,
  onSubmit,
}: PrintJobWizardProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [mode, setMode] = useState<'all' | 'single'>('all');
  const [staffNumber, setStaffNumber] = useState(defaultStaffNumber || '');
  const [format, setFormat] = useState<'pdf' | 'html'>('pdf');
  const [template, setTemplate] = useState(templateOptions[0]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const stepProgress = (activeStep - 1) * 33;

  const canProceed = useMemo(() => {
    if (activeStep === 2 && mode === 'single') {
      return staffNumber.trim().length > 0;
    }
    return true;
  }, [activeStep, mode, staffNumber]);

  const handleNext = () => {
    if (activeStep >= 4) return;
    if (!canProceed) return;
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep <= 1) return;
    setActiveStep((prev) => prev - 1);
  };

  const handleConfirm = async () => {
    setError(null);
    setIsSending(true);

    try {
      await onSubmit({ mode, staffNumber: mode === 'single' ? staffNumber.trim() : undefined, format, template });
      toast({ title: 'Print job queued', description: 'The print job has been successfully submitted.', variant: 'default' });
      setActiveStep(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit print job';
      setError(message); 
      toast({ title: 'Submission failed', description: message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between px-6">
          <div>
            <h2 className="text-2xl font-bold">Print Job Builder</h2>
            <p className="text-sm text-muted-foreground">Run {payrollPeriod} · {payrollRunId}</p>
          </div>
          <Badge variant="default">Step {activeStep} of 4</Badge>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-4">
          <Progress value={stepProgress} />
          {error && <Alert variant="destructive"><div className="font-semibold">Error</div><div>{error}</div></Alert>}

          {activeStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Target scope</h3>
              <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'all' | 'single')}>
                <label className="flex items-center gap-2"><RadioGroupItem value="all" checked={mode === 'all'} />All payslips ({totalRecords})</label>
                <label className="flex items-center gap-2"><RadioGroupItem value="single" checked={mode === 'single'} />Single payslip</label>
              </RadioGroup>
              {mode === 'single' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Staff Number</label>
                  <Input value={staffNumber} onChange={(e) => setStaffNumber(e.target.value)} placeholder="E.g., ADJO0000" />
                  <p className="text-xs text-muted-foreground">Exact staff number required for single mode</p>
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Template selection</h3>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="w-full" />
                <SelectContent>
                  {templateOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Output options</h3>
              <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'html')}>
                <label className="flex items-center gap-2"><RadioGroupItem value="pdf" checked={format === 'pdf'} />PDF (recommended)</label>
                <label className="flex items-center gap-2"><RadioGroupItem value="html" checked={format === 'html'} />HTML preview</label>
              </RadioGroup>
              <p className="text-sm text-muted-foreground">Note: PDF generation uses server-side rendering in the print service.</p>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Review and confirm</h3>
              <Separator />
              <p><strong>Target:</strong> {mode === 'all' ? 'All payslips' : `Staff ${staffNumber}`}</p>
              <p><strong>Template:</strong> {template}</p>
              <p><strong>Format:</strong> {format.toUpperCase()}</p>
              <p><strong>Period:</strong> {payrollPeriod}</p>
            </div>
          )}

          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" onClick={handleBack} disabled={activeStep === 1 || isSending}>Back</Button>
            {activeStep < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed || isSending}>Continue</Button>
            ) : (
              <Button onClick={handleConfirm} disabled={isSending}>Submit Print Job</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
