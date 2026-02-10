import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Home } from 'lucide-react';
import { logger } from '@/utils/prodLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  copied: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ALWAYS log errors (production + dev) for debugging
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('🚨 Global Error Boundary caught error:');
    logger.error('Error:', error);
    logger.error('Message:', error.message);
    logger.error('Stack:', error.stack);
    logger.error('Component Stack:', errorInfo?.componentStack);
    logger.error('URL:', window.location.href);
    logger.error('User Agent:', navigator.userAgent);
    logger.error('Timestamp:', new Date().toISOString());
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyDetails = async () => {
    const { error, errorInfo } = this.state;
    const errorDetails = `
Error: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

User Agent: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      logger.error('Failed to copy error details:', err);
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const { error, copied } = this.state;
      
      // iOS-style minimal error UI with proper spacing
      return (
        <div className="min-h-screen min-h-dvh bg-background flex flex-col items-center justify-center p-6 safe-area-inset">
          {/* Icon */}
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-semibold text-foreground mb-2 text-center">
            Something went wrong
          </h1>
          
          {/* Subtitle */}
          <p className="text-muted-foreground text-center mb-8 max-w-xs">
            We encountered an unexpected error. Please try again.
          </p>
          
          {/* Dev error details */}
          {import.meta.env.DEV && error && (
            <div className="w-full max-w-sm bg-muted/50 border border-border p-3 rounded-xl text-xs font-mono text-destructive overflow-auto max-h-24 mb-6">
              {error.message}
            </div>
          )}
          
          {/* Action buttons - iOS style */}
          <div className="w-full max-w-xs space-y-3">
            <button 
              onClick={this.handleReload}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium text-base active:scale-[0.98] transition-transform"
            >
              Try Again
            </button>
            
            <button 
              onClick={this.handleGoHome}
              className="w-full h-12 bg-secondary text-secondary-foreground rounded-xl font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
            
            <button 
              onClick={this.handleCopyDetails}
              className="w-full h-10 text-muted-foreground text-sm active:opacity-70 transition-opacity"
            >
              {copied ? 'Copied!' : 'Copy Error Details'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
