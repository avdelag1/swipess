import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from './AppError';
import { logger } from '@/utils/prodLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      logger.error('Uncaught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <AppError 
          error={this.state.error || new Error('Unknown error')}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;