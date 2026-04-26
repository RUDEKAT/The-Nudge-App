import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/components/AppProvider';

export const dynamic = 'force-dynamic';

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
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}