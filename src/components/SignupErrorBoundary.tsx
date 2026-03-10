import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SignupErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      logger.error('Signup flow error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card backdrop-blur-sm rounded-lg p-8 text-center space-y-4 border border-border">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Setup Error</h2>
            <p className="text-muted-foreground">
              We encountered an error setting up your account. This might be due to a network issue or temporary problem.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={this.handleRetry}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Try Again
              </Button>
              <p className="text-sm text-muted-foreground">
                If the problem persists, please contact support
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SignupErrorBoundary;
