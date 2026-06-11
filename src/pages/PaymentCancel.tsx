import { useNavigate } from 'react-router-dom';
import { ArrowLeft, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { STORAGE } from '@/constants/app';

export default function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem(STORAGE.SELECTED_PLAN_KEY);
    sessionStorage.removeItem(STORAGE.PENDING_ACTIVATION_KEY);
    sessionStorage.removeItem(STORAGE.PAYMENT_RETURN_PATH_KEY);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md p-8">
        <motion.button
          onClick={() => navigate(-1)}
          whileTap={{ scale: 0.8, transition: { type: "spring", stiffness: 400, damping: 17 } }}
          className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors duration-150 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
        <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was cancelled. No charges were made.
        </p>
        <Button onClick={() => navigate('/subscription/packages')} size="lg">
          Try Again
        </Button>
      </div>
    </div>
  );
}


