'use client';

import { Analytics } from '@vercel/analytics/next';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
