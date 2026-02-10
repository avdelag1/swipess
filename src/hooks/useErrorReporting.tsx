import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
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

    // Log to console for development
    logger.error('Error Report:', errorReport);
    
    // Show user-friendly toast
    toast({
      title: "Something went wrong",
      description: "We've been notified and are working on a fix.",
      variant: "destructive",
    });
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