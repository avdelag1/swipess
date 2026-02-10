import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const [processing, setProcessing] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current || !user) return;
    processedRef.current = true;

    const processPayment = async () => {
      const pendingPurchase = localStorage.getItem(STORAGE.SELECTED_PLAN_KEY) ||
                               localStorage.getItem(STORAGE.PENDING_ACTIVATION_KEY);
      const returnPath = localStorage.getItem(STORAGE.PAYMENT_RETURN_PATH_KEY);

      if (!pendingPurchase) {
        // No pending purchase - might be a refresh, just redirect
        toast.error('No pending purchase found. If you completed a payment, please contact support.');
        navigate(returnPath || '/client/dashboard', { replace: true });
        return;
      }

      try {
        const purchase = JSON.parse(pendingPurchase);
        let pkg;

        // Fetch package based on what info we have
        if (purchase.packageId) {
          const { data } = await supabase
            .from('subscription_packages')
            .select('*')
            .eq('id', purchase.packageId)
            .single();
          pkg = data;
        } else if (purchase.planId) {
          pkg = await mapMonthlyPlanToPackage(purchase.planId);
        }

        if (!pkg) {
          toast.error('Package not found. Please contact support.');
          navigate(returnPath || '/client/dashboard', { replace: true });
          return;
        }

        const role = pkg.package_category?.includes('client') ? 'client' : 'owner';
        const isMonthly = pkg.package_category?.includes('monthly');
        const isPayPerUse = pkg.package_category?.includes('pay_per_use');

        // Process subscription/activation silently
        if (isMonthly) {
          await processMonthlySubscription(user.id, pkg);
        } else if (isPayPerUse) {
          await processPayPerUseActivation(user.id, pkg);
        }

        // Clear all payment-related localStorage
        localStorage.removeItem(STORAGE.SELECTED_PLAN_KEY);
        localStorage.removeItem(STORAGE.PENDING_ACTIVATION_KEY);
        localStorage.removeItem(STORAGE.PAYMENT_RETURN_PATH_KEY);

        // Invalidate relevant queries for immediate UI update
        queryClient.invalidateQueries({ queryKey: ['message-activations'] });
        queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['legal-document-quota'] });

        // Show single toast notification - premium, non-intrusive
        toast.success('Congratulations! Your Premium package is now active.', {
          duration: 4000,
          icon: '🎉',
        });

        // Silent redirect back to where user was (or dashboard)
        const targetPath = returnPath || `/${role}/dashboard`;
        navigate(targetPath, { replace: true });

      } catch (error) {
        logger.error('Payment processing error:', error);
        toast.error('Failed to process payment. Please contact support with your PayPal receipt.');
        navigate(returnPath || '/client/dashboard', { replace: true });
      }
    };

    processPayment();
  }, [user, navigate, queryClient]);

  // Process monthly subscription
  const processMonthlySubscription = async (userId: string, pkg: any) => {
    // Deactivate any previous subscriptions of same category
    const { data: existingSubs } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (existingSubs && existingSubs.length > 0) {
      await supabase
        .from('user_subscriptions')
        .update({ is_active: false })
        .in('id', existingSubs.map(s => s.id));
    }

    // Create new subscription
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_package_id: pkg.id,
        payment_status: 'paid',
        is_active: true,
      });

    if (subError) throw subError;

    // Create message activations for monthly
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1);

    const { error: activError } = await supabase
      .from('message_activations')
      .insert({
        user_id: userId,
        activation_type: 'monthly_subscription',
        total_activations: pkg.message_activations || 30,
        remaining_activations: pkg.message_activations || 30,
        used_activations: 0,
        reset_date: resetDate.toISOString().split('T')[0],
      });

    if (activError) throw activError;

    // Create legal document quota if included
    if (pkg.legal_documents_included && pkg.legal_documents_included > 0) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);

      await supabase
        .from('legal_document_quota')
        .upsert({
          user_id: userId,
          monthly_limit: pkg.legal_documents_included,
          used_this_month: 0,
          reset_date: nextMonth.toISOString().split('T')[0],
        });
    }
  };

  // Process pay-per-use activation
  const processPayPerUseActivation = async (userId: string, pkg: any) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (pkg.duration_days || 30));

    const { error: activError } = await supabase
      .from('message_activations')
      .insert({
        user_id: userId,
        activation_type: 'pay_per_use',
        total_activations: pkg.message_activations,
        remaining_activations: pkg.message_activations,
        used_activations: 0,
        expires_at: expiresAt.toISOString(),
      });

    if (activError) throw activError;
  };

  // Map legacy plan IDs to new package names
  const mapMonthlyPlanToPackage = async (planId: string) => {
    const planMap: Record<string, string> = {
      'client-unlimited': 'Ultimate Seeker',
      'client-premium-plus-plus': 'Multi-Matcher',
      'client-premium': 'Basic Explorer',
      'owner-unlimited': 'Empire Builder',
      'owner-premium-max': 'Multi-Asset Manager',
      'owner-premium-plus-plus': 'Category Pro',
      'owner-premium-plus': 'Starter Lister',
    };

    const packageName = planMap[planId];
    if (!packageName) return null;

    const { data } = await supabase
      .from('subscription_packages')
      .select('*')
      .eq('name', packageName)
      .maybeSingle();

    return data;
  };

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
