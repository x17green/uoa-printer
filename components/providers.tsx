'use client';

import { HeroUIProvider } from '@heroui/react';
import { Analytics } from '@vercel/analytics/next';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HeroUIProvider>
      {children}
      <Analytics />
    </HeroUIProvider>
  );
}
