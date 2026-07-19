import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
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

      // Due to schema drift on the live database (missing columns like description, 
      // or older columns like report_reason being required), we try a sequence of payloads
      // from most complete to bare minimum, until one succeeds.


      // Self-healing payload algorithm:
      // Start with a maximal payload containing ALL historical and modern columns.
      // If Supabase complains about a missing column (PGRST204), remove it and try again.
      const payload: Record<string, any> = {
        id: crypto.randomUUID(),
        reporter_id: user.id,
        reported_user_id: params.reportedUserId || null,
        reported_listing_id: params.reportedListingId || null,
        report_type: params.reportType, // Sometimes used for reason, sometimes 'user'/'listing'
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Potential drift columns
        report_category: params.reportCategory,
        description: params.description,
        evidence_urls: params.evidenceUrls || [],
        
        // Legacy NOT NULL columns
        report_reason: params.reportType, 
        report_details: params.description,
      };

      let attempts = 0;
      let lastError;

      while (attempts < 10) {
        attempts++;
        const { data, error } = await supabase
          .from('user_reports' as any)
          .insert(payload)
          .select()
          .single();

        if (!error) {
          if (attempts > 1) {
            logger.info(`Self-healed payload succeeded on attempt ${attempts}`, { payload });
          }
          return data;
        }

        lastError = error;
        
        // Schema Cache Error: Missing Column
        if (error.code === 'PGRST204') {
          const match = error.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1]) {
            const missingCol = match[1];
            logger.warn(`Removing missing column '${missingCol}' from payload...`);
            delete payload[missingCol];
            continue; // Try again!
          }
        }
        
        // NOT NULL Violation
        if (error.code === '23502') {
          const match = error.message.match(/null value in column "([^"]+)"/);
          if (match && match[1]) {
            const nullCol = match[1];
            logger.warn(`NOT NULL violation for '${nullCol}'. Fixing...`);
            
            // If we somehow passed null/undefined, force a fallback string
            if (!payload[nullCol]) {
               payload[nullCol] = params.description || params.reportType || 'N/A';
               continue; // Try again!
            }
          }
        }

        // If we get here, it's an error we can't heal from
        break;
      }

      throw lastError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
      appToast.success('Report submitted');
    },
    onError: (error: any) => {
      logger.error('Error creating report:', error);
      const msg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      appToast.error('Failed to submit report', msg);
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


