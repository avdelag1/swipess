import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

export type ReportType =
  | 'fake_profile'
  | 'not_real_owner'
  | 'broker_posing_as_client'
  | 'broker_posing_as_owner'
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'scam'
  | 'fake_listing'
  | 'misleading_info'
  | 'other';

export type ReportCategory = 'user_profile' | 'listing' | 'message' | 'review';

interface CreateReportParams {
  reportedUserId?: string;
  reportedListingId?: string;
  reportType: ReportType;
  reportCategory: ReportCategory;
  description: string;
  evidenceUrls?: string[];
}

interface CheckReportParams {
  reportedUserId?: string;
  reportedListingId?: string;
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateReportParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in to report');

      // Validate that either user or listing is reported, not both
      if (params.reportedUserId && params.reportedListingId) {
        throw new Error('Cannot report both user and listing at the same time');
      }
      if (!params.reportedUserId && !params.reportedListingId) {
        throw new Error('Must specify either reportedUserId or reportedListingId');
      }

      // Check if user has already reported this entity
      const { data: existingReport } = await supabase.rpc('has_user_already_reported' as any, {
        p_reporter_id: user.id,
        p_reported_user_id: params.reportedUserId || null,
        p_reported_listing_id: params.reportedListingId || null,
      });

      if (existingReport) {
        throw new Error('You have already submitted a report for this. Our team is reviewing it.');
      }

      // Create the report
      const { data, error } = await supabase
        .from('user_reports' as any)
        .insert({
          reporter_id: user.id,
          reported_user_id: params.reportedUserId || null,
          reported_listing_id: params.reportedListingId || null,
          report_type: params.reportType,
          report_category: params.reportCategory,
          description: params.description,
          evidence_urls: params.evidenceUrls || [],
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
      toast.success('Report submitted', {
        description: 'Thank you for reporting. Our team will review this shortly.',
      });
    },
    onError: (error: Error) => {
      logger.error('Error creating report:', error);
      toast.error('Failed to submit report', {
        description: error.message || 'Please try again later',
      });
    },
  });
}

export function useCheckExistingReport() {
  return useMutation({
    mutationFn: async (params: CheckReportParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_user_already_reported' as any, {
        p_reporter_id: user.id,
        p_reported_user_id: params.reportedUserId || null,
        p_reported_listing_id: params.reportedListingId || null,
      });

      if (error) {
        logger.error('Error checking existing report:', error);
        return false;
      }

      return data;
    },
  });
}

export function useMyReports() {
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in');

      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Report type labels for UI
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  fake_profile: 'Fake Profile',
  not_real_owner: 'Not a Real Property Owner',
  broker_posing_as_client: 'Broker Pretending to be Renter',
  broker_posing_as_owner: 'Broker Pretending to be Owner',
  inappropriate_content: 'Inappropriate Content',
  harassment: 'Harassment',
  spam: 'Spam or Advertising',
  scam: 'Scam or Fraud',
  fake_listing: 'Fake Property Listing',
  misleading_info: 'Misleading Information',
  other: 'Other Issue',
};

// Report type descriptions for UI
export const REPORT_TYPE_DESCRIPTIONS: Record<ReportType, string> = {
  fake_profile: 'This person is pretending to be someone else',
  not_real_owner: 'This person does not actually own this property',
  broker_posing_as_client: 'This is a broker or agent pretending to be a renter',
  broker_posing_as_owner: 'This is a broker or agent pretending to be an owner',
  inappropriate_content: 'Profile contains offensive or inappropriate photos/text',
  harassment: 'This person is harassing me or others',
  spam: 'This is spam, advertising, or unwanted solicitation',
  scam: 'This appears to be a scam or fraudulent activity',
  fake_listing: 'This property listing is fake or doesn\'t exist',
  misleading_info: 'The information provided is false or misleading',
  other: 'Issue not listed above',
};
