import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
import { useAuth } from '@/hooks/useAuth';
import { STORAGE } from '@/constants/app';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/prodLogger';

/**
 * PaymentSuccess - Silent Payment Processing
 *
 * Premium UX: Process payment in background and redirect silently
 * - No popups, no modals, no countdown
 * - Single toast notification
 * - Returns user to where they were before payment
 */
export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [_processing, _setProcessing] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current || !user) return;
    processedRef.current = true;

    const processPayment = async () => {
      const returnPath =
        sessionStorage.getItem(STORAGE.PAYMENT_RETURN_PATH_KEY) ||
        localStorage.getItem(STORAGE.PAYMENT_RETURN_PATH_KEY);

      // We no longer read SELECTED_PLAN_KEY and blindly insert.
      // The backend (e.g. validate-paypal-order edge function or webhook) 
      // will handle the database inserts asynchronously.

      // Clear the return path
      sessionStorage.removeItem(STORAGE.PAYMENT_RETURN_PATH_KEY);
      localStorage.removeItem(STORAGE.PAYMENT_RETURN_PATH_KEY);

      // Invalidate relevant queries so the UI updates when the backend finishes
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['legal-document-quota'] });

      appToast.info('Verifying Payment', 'Your premium features will be unlocked momentarily once verified by PayPal.');

      setTimeout(() => {
        const targetPath = returnPath || `/client/dashboard`;
        navigate(targetPath, { replace: true });
      }, 3000);
    };

    processPayment();
  }, [user, navigate, queryClient]);

  // Minimal loading UI - just a spinner, user won't see this long
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Processing your payment...</p>
      </div>
    </div>
  );
}


