import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Paperclip, 
  Image, 
  FileText, 
  Video, 
  Download, 
  Trash2, 
  Upload,
  X 
} from 'lucide-react';
import { useMessageAttachments, useUploadAttachment, useDeleteAttachment, getAttachmentUrl } from '@/hooks/useMessageAttachments';
import { toast } from '@/hooks/use-toast';

interface MessageAttachmentsProps {
  messageId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

export function MessageAttachments({ 
  messageId, 
  canUpload = false, 
  canDelete = false 
}: MessageAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: attachments = [], isLoading } = useMessageAttachments(messageId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    // Determine attachment type
    let attachmentType: 'image' | 'document' | 'video';
    if (file.type.startsWith('image/')) {
      attachmentType = 'image';
    } else if (file.type.startsWith('video/')) {
      attachmentType = 'video';
    } else {
      attachmentType = 'document';
    }

    setIsUploading(true);
    try {
      await uploadAttachment.mutateAsync({
        messageId,
        file,
        attachmentType,
      });
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (attachment: any) => {
    try {
      const url = await getAttachmentUrl(attachment.file_path);
      if (!url) {
        toast({
          title: 'Feature Not Available',
          description: 'File attachments feature is not yet available.',
          variant: 'destructive',
        });
        return;
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Unable to download the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment.mutateAsync(attachmentId);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getFileIcon = (attachmentType: string, mimeType: string) => {
    switch (attachmentType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground">Loading attachments...</div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Upload Button */}
      {canUpload && (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-xs"
          >
            {isUploading ? (
              <>
                <Upload className="w-3 h-3 mr-1 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Paperclip className="w-3 h-3 mr-1" />
                Attach File
              </>
            )}
          </Button>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="p-2 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(attachment.attachment_type, attachment.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    className="h-6 w-6 p-0"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deleteAttachment.isPending}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}