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
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Payment Error</h2>
          <p className="text-red-700 mb-4 text-center max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred while processing your payment.'}
          </p>
          <Button 
            onClick={this.handleReset}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
