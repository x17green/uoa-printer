'use client';

import { useState, useRef } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Button } from '@heroui/react';

interface FileUploadZoneProps {
  onFileSelect: (file: File, month: number, year: number) => void;
  isLoading?: boolean;
}

export function FileUploadZone({ onFileSelect, isLoading = false }: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelect(files[0], month, year);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0], month, year);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex gap-3 bg-primary text-primary-foreground">
        <div className="flex flex-col">
          <p className="text-lg font-semibold">Upload Payroll File</p>
          <p className="text-sm opacity-90">Upload Excel file with payroll data</p>
        </div>
      </CardHeader>
      <CardBody className="gap-6">
        {/* Month and Year Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              disabled={isLoading}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              disabled={isLoading}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragActive
              ? 'border-primary bg-primary bg-opacity-10'
              : 'border-border bg-muted hover:border-primary'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleChange}
            className="hidden"
            disabled={isLoading}
          />

          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-12 h-12 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {dragActive ? 'Drop your file here' : 'Drag and drop your payroll file'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              color="primary"
              variant="solid"
              className="mt-2"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Browse Files
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
