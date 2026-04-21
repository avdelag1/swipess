import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { logger } from '@/utils/prodLogger';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  showDetails: boolean;
}

class SignupErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Signup flow error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/?clear-cache=1';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-dvh bg-[#f9f9fb] flex items-center justify-center p-6 sm:p-8">
          {/* Background Ambient Glows */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-rose-500/10 blur-[120px]" />
            <div className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-orange-500/10 blur-[150px]" />
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full"
          >
            <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 text-center shadow-[0_22px_70px_rgba(0,0,0,0.06)] relative overflow-hidden group">
              {/* Subtle top-bar highlight */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-rose-500 opacity-60" />
              
              <div className="relative mb-8 flex justify-center">
                <motion.div
                  animate={{ 
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.05, 1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-24 h-24 rounded-[2rem] bg-rose-50 flex items-center justify-center border border-rose-100/50 shadow-inner"
                >
                  <AlertCircle className="w-12 h-12 text-rose-500" strokeWidth={1.8} />
                </motion.div>
                
                {/* Decorative particles */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-rose-400/20 blur-2xl rounded-full -z-10" />
              </div>

              <h2 className="text-4xl font-black text-zinc-900 tracking-tighter mb-4 italic italic-brand">
                Setup Error
              </h2>
              
              <p className="text-zinc-500 text-sm font-bold leading-relaxed mb-10 max-w-[280px] mx-auto uppercase tracking-wider">
                We encountered an error setting up your account. 
                <span className="block mt-2 opacity-60 font-normal normal-case tracking-normal">
                  This might be due to a network issue or temporary problem.
                </span>
              </p>

              <div className="space-y-4">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full h-16 rounded-[1.5rem] bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black uppercase tracking-widest text-xs shadow-[0_12px_40px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_50px_rgba(249,115,22,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <div className="pt-4 flex flex-col items-center gap-4">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
                    If the problem persists, please contact support
                  </p>
                  
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer border border-zinc-200/50 shadow-sm">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Technical Details Toggle */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-zinc-500 transition-colors flex items-center gap-2"
                      >
                        {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                        <div className={`w-1 h-1 rounded-full ${this.state.showDetails ? 'bg-rose-500' : 'bg-zinc-200'}`} />
                      </button>

                      {this.state.showDetails && this.state.error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100/50 text-left max-w-sm overflow-hidden"
                        >
                          <p className="text-[10px] font-mono text-rose-600/80 break-all leading-relaxed mb-2 font-bold">
                            {this.state.error.name}: {this.state.error.message}
                          </p>
                          {this.state.error.stack && (
                            <p className="text-[9px] font-mono text-zinc-400 line-clamp-4 leading-normal">
                              {this.state.error.stack}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SignupErrorBoundary;


