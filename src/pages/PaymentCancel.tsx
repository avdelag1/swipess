import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('pending_purchase');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.button
        onClick={() => navigate(-1)}
        whileTap={{ scale: 0.8, transition: { type: "spring", stiffness: 400, damping: 17 } }}
        className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors duration-150 mb-4 px-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>
      <div className="text-center max-w-md p-8">
        <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was cancelled. No charges were made.
        </p>
        <Button onClick={() => navigate('/subscription-packages')} size="lg">
          Try Again
        </Button>
      </div>
    </div>
  );
}
