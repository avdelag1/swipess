import React, { Component, ReactNode } from 'react';
import { logger } from '@/utils/prodLogger';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[PaymentErrorBoundary] Payment error caught', {
      message: error.message,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center p-8 rounded-lg border"
          style={{
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            borderColor: 'hsl(var(--destructive) / 0.3)',
          }}
        >
          <AlertCircle
            className="w-12 h-12 mb-4"
            style={{ color: 'hsl(var(--destructive))' }}
          />
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: 'hsl(var(--destructive))' }}
          >
            Payment Error
          </h2>
          <p
            className="mb-4 text-center max-w-sm"
            style={{ color: 'hsl(var(--destructive) / 0.8)' }}
          >
            {this.state.error?.message || 'An unexpected error occurred while processing your payment.'}
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            className="hover:opacity-80"
            style={{
              borderColor: 'hsl(var(--destructive))',
              color: 'hsl(var(--destructive))',
            }}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
