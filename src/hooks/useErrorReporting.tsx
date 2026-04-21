import { useEffect } from 'react';
import { logger } from '@/utils/prodLogger';

interface ErrorReport {
  error: Error;
  context: string;
  userId?: string;
  timestamp: Date;
}

export function useErrorReporting() {
  const reportError = (error: Error, context: string) => {
    const errorReport: ErrorReport = {
      error,
      context,
      timestamp: new Date(),
    };

    // Log to console for development only — avoids noisy console errors in production
    logger.warn(`[ErrorReport] ${errorReport.context}: ${errorReport.error?.message ?? errorReport.error}`);
  };

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportError(new Error(event.message), 'Global error handler');
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      reportError(new Error(event.reason), 'Unhandled promise rejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return { reportError };
}


