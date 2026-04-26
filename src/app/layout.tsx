import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/components/AppProvider';

export const metadata: Metadata = {
  title: 'Nudge · Post without the panic',
  description: 'AI-powered social media posting assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}