import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { shareContractInConversation } from '@/utils/contractSigning';
import {
  type DocumentAttachment,
  type VaultContractRow,
  type VaultFileRow,
  buildDocumentShareContent,
  contractDisplayStatus,
  isContractWithParty,
  isDocumentMessage,
  isVaultDraft,
  parseDocumentAttachments,
} from '@/utils/messageDocuments';

export function useUserVaultDocuments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-vault-documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return { contracts: [] as VaultContractRow[], files: [] as VaultFileRow[] };

      const [contractsRes, filesRes] = await Promise.all([
        supabase
          .from('digital_contracts')
          .select('id, owner_id, client_id, title, content, status, template_type, owner_signature, client_signature, metadata, updated_at, created_at')
          .or(`owner_id.eq.${user.id},client_id.eq.${user.id}`)
          .order('updated_at', { ascending: false }),
        supabase
          .from('legal_documents')
          .select('id, file_name, file_path, document_type, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (contractsRes.error) logger.warn('[useUserVaultDocuments] contracts', contractsRes.error);
      if (filesRes.error) logger.warn('[useUserVaultDocuments] files', filesRes.error);

      return {
        contracts: (contractsRes.data || []) as VaultContractRow[],
        files: (filesRes.data || []) as VaultFileRow[],
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

export function useConversationVaultDocuments(otherUserId?: string) {
  const { data, ...rest } = useUserVaultDocuments();
  const { user } = useAuth();

  const sendable = (data?.contracts || []).filter((contract) => {
    if (!user?.id) return false;
    if (contract.owner_id !== user.id) return false;
    return isVaultDraft(contract) || isContractWithParty(contract, otherUserId || '');
  });

  const withParty = (data?.contracts || []).filter(
    (contract) => otherUserId && isContractWithParty(contract, otherUserId),
  );

  const signed = (data?.contracts || []).filter(
    (contract) => contractDisplayStatus(contract) === 'signed',
  );

  return {
    ...rest,
    data,
    sendable,
    withParty,
    signed,
    files: data?.files || [],
  };
}

export function useSendDocumentMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      recipientId,
      recipientRole,
      contract,
    }: {
      conversationId: string;
      recipientId: string;
      recipientRole: 'client' | 'owner';
      contract: VaultContractRow;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const share = await shareContractInConversation({
        contract: contract as Record<string, unknown>,
        senderId: user.id,
        recipientId,
        recipientRole,
      });

      const attachments: DocumentAttachment[] = [share.attachment];

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: share.content,
          message_type: 'document',
          attachments,
        } as any)
        .select('id, conversation_id, sender_id, content, message_type, attachments, is_read, created_at')
        .single();

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-vault-documents', user?.id] });
      appToast.success('Document sent', 'They can open and sign it from this chat.');
    },
    onError: (err) => {
      logger.error('[useSendDocumentMessage]', err);
      appToast.error('Could not send document', err instanceof Error ? err.message : 'Try again.');
    },
  });
}

export function useShareVaultFileMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      file,
    }: {
      conversationId: string;
      file: VaultFileRow;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const attachment: DocumentAttachment = {
        type: 'vault_file',
        id: file.id,
        title: file.file_name,
        status: 'uploaded',
        file_name: file.file_name,
      };

      const content = buildDocumentShareContent(file.file_name, 'uploaded');

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: 'document',
          attachments: [attachment],
        } as any)
        .select('id, conversation_id, sender_id, content, message_type, attachments, is_read, created_at')
        .single();

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      appToast.success('File shared in chat');
    },
    onError: () => appToast.error('Could not share file'),
  });
}

export function extractThreadDocuments(messages: Array<{ message_type?: string; attachments?: unknown }>) {
  const seen = new Set<string>();
  const docs: DocumentAttachment[] = [];

  for (const msg of messages) {
    if (!isDocumentMessage(msg.message_type)) continue;
    for (const att of parseDocumentAttachments(msg.attachments)) {
      if (seen.has(att.id)) continue;
      seen.add(att.id);
      docs.push(att);
    }
  }

  return docs;
}