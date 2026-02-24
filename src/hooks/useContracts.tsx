import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

export interface DigitalContract {
  id: string;
  title: string;
  contract_type: 'lease' | 'rental' | 'purchase' | 'rental_agreement';
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_by: string;
  listing_id?: string;
  client_id?: string;
  owner_id: string;
  status: 'pending' | 'signed_by_owner' | 'signed_by_client' | 'completed' | 'cancelled' | 'disputed';
  terms_and_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractSignature {
  id: string;
  contract_id: string;
  signer_id: string;
  signature_data: string;
  signature_type: 'drawn' | 'typed' | 'uploaded';
  signed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface DealStatus {
  id: string;
  contract_id: string;
  client_id: string;
  owner_id: string;
  listing_id?: string;
  status: 'pending' | 'signed_by_owner' | 'signed_by_client' | 'completed' | 'cancelled' | 'disputed';
  signed_by_owner_at?: string;
  signed_by_client_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export function useContracts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('digital_contracts')
        .select(`
          *,
          signatures:contract_signatures(*),
          deal_status:deal_status_tracking(*)
        `)
        .or(`created_by.eq.${user.id},client_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (DigitalContract & { 
        signatures: ContractSignature[];
        deal_status: DealStatus[];
      })[];
    },
    enabled: !!user?.id
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (contractData: {
      title: string;
      contract_type: 'lease' | 'rental' | 'purchase' | 'rental_agreement';
      file: File;
      client_id?: string;
      listing_id?: string;
      terms_and_conditions?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Upload contract file
      const fileExt = contractData.file.name.split('.').pop() || 'pdf';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `contracts/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, contractData.file);

      if (uploadError) throw uploadError;

      // Create contract record
      const { data, error } = await supabase
        .from('digital_contracts')
        .insert({
          title: contractData.title,
          contract_type: contractData.contract_type,
          file_path: filePath,
          file_name: contractData.file.name,
          file_size: contractData.file.size,
          mime_type: contractData.file.type,
          created_by: user.id,
          owner_id: user.id,
          client_id: contractData.client_id,
          listing_id: contractData.listing_id,
          terms_and_conditions: contractData.terms_and_conditions
        })
        .select()
        .single();

      if (error) throw error;

      // Create deal status record
      if (contractData.client_id) {
        await supabase
          .from('deal_status_tracking')
          .insert({
            contract_id: data.id,
            client_id: contractData.client_id,
            owner_id: user.id,
            listing_id: contractData.listing_id,
            status: 'pending'
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract created successfully!');
    },
    onError: (error) => {
      logger.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    }
  });
}

export function useSignContract() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contractId,
      signatureData,
      signatureType
    }: {
      contractId: string;
      signatureData: string;
      signatureType: 'drawn' | 'typed' | 'uploaded';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Create signature record
      const { data: signature, error: signatureError } = await supabase
        .from('contract_signatures')
        .insert({
          contract_id: contractId,
          signer_id: user.id,
          signature_data: signatureData,
          signature_type: signatureType,
          ip_address: null, // Could be captured from request
          user_agent: navigator.userAgent
        })
        .select()
        .single();

      if (signatureError) throw signatureError;

      // Get contract to determine user role
      const { data: contract, error: contractError } = await supabase
        .from('digital_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      // Update deal status based on who signed
      const isOwner = contract.owner_id === user.id;
      const isClient = contract.client_id === user.id;

      let newStatus: string;
      const updateData: any = {};

      if (isOwner) {
        newStatus = 'signed_by_owner';
        updateData.signed_by_owner_at = new Date().toISOString();
      } else if (isClient) {
        // Check if owner already signed
        const { data: ownerSignature } = await supabase
          .from('contract_signatures')
          .select('*')
          .eq('contract_id', contractId)
          .eq('signer_id', contract.owner_id)
          .single();

        if (ownerSignature) {
          newStatus = 'completed';
          updateData.completed_at = new Date().toISOString();
        } else {
          newStatus = 'signed_by_client';
        }
        updateData.signed_by_client_at = new Date().toISOString();
      } else {
        throw new Error('User not authorized to sign this contract');
      }

      updateData.status = newStatus as 'pending' | 'signed_by_owner' | 'signed_by_client' | 'completed' | 'cancelled' | 'disputed';

      // Update deal status
      await supabase
        .from('deal_status_tracking')
        .update(updateData)
        .eq('contract_id', contractId);

      // Update contract status
      await supabase
        .from('digital_contracts')
        .update({ status: newStatus as 'pending' | 'signed_by_owner' | 'signed_by_client' | 'completed' | 'cancelled' | 'disputed' })
        .eq('id', contractId);

      return signature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract signed successfully!');
    },
    onError: (error) => {
      logger.error('Error signing contract:', error);
      toast.error('Failed to sign contract');
    }
  });
}

export function useActiveDeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-deals', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('deal_status_tracking')
        .select(`
          *,
          contract:digital_contracts(*)
        `)
        .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)
        .in('status', ['pending', 'signed_by_owner', 'signed_by_client'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });
}

export function useCreateDisputeReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contractId,
      reportedAgainst,
      issueType,
      description
    }: {
      contractId: string;
      reportedAgainst: string;
      issueType: string;
      description: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dispute_reports')
        .insert({
          contract_id: contractId,
          reported_by: user.id,
          reported_against: reportedAgainst,
          issue_type: issueType,
          description: description,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['active-deals'] });
      toast.success('Dispute report submitted successfully!');
    },
    onError: (error) => {
      logger.error('Error creating dispute report:', error);
      toast.error('Failed to submit dispute report');
    }
  });
}