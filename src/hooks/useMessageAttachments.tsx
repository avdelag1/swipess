import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';

// Feature flag for attachments
const _ATTACHMENTS_ENABLED = false;

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  attachment_type: 'image' | 'document' | 'video';
  created_at: string;
}

export const useMessageAttachments = (messageId: string) => {
  return useQuery({
    queryKey: ['message-attachments', messageId],
    queryFn: async () => {
      // Return empty array until database migration is complete
      return [] as MessageAttachment[];
    },
    enabled: false, // Disable until database is ready
  });
};

export const useUploadAttachment = () => {
  const _queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId: _messageId,
      file: _file,
      attachmentType: _attachmentType
    }: {
      messageId: string;
      file: File;
      attachmentType: 'image' | 'document' | 'video';
    }) => {
      // Feature is disabled - return null gracefully
      return null;
    },
    onSuccess: () => {
      // Don't show success toast when feature is disabled
    },
    onError: (_error: Error) => {
      toast({
        title: 'Upload Failed',
        description: 'File attachments feature is not yet available.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteAttachment = () => {
  const _queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_attachmentId: string) => {
      // Feature is disabled - return null gracefully
      return null;
    },
    onSuccess: () => {
      // Don't show success toast when feature is disabled
    },
    onError: (_error: Error) => {
      toast({
        title: 'Delete Failed',
        description: 'File attachments feature is not yet available.',
        variant: 'destructive',
      });
    },
  });
};

export const getAttachmentUrl = async (_filePath: string): Promise<string | null> => {
  // Feature is disabled - return null gracefully
  return null;
};