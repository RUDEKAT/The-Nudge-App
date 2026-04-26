'use client';

import { useAppStore } from '@/stores/useAppStore';
import { useEffect } from 'react';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { toast, clearToast } = useAppStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => clearToast(), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  return (
    <>
      {children}
      {toast && (
        <div className="toast show">{toast.message}</div>
      )}
    </>
  );
}