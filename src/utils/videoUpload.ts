import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

/**
 * Compresses and converts a recorded Blob to MP4/WebM depending on browser support,
 * though we typically just upload the raw MediaRecorder `video/webm` output.
 */
function getVideoExtension(mimeType: string): string {
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('quicktime') || mimeType.includes('mov')) return 'mov';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogv';
    return 'mp4';
}

export async function uploadListingVideo(userId: string, videoBlob: Blob): Promise<string> {
    try {
        const fileExt = getVideoExtension(videoBlob.type);
        const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError, data: _data } = await supabase.storage
            .from('listing-videos')
            .upload(filePath, videoBlob, {
                contentType: videoBlob.type,
                upsert: false
            });

        if (uploadError) {
            logger.error('Video upload error:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('listing-videos')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        logger.error('Error in uploadListingVideo:', error);
        toast.error('Failed to upload video');
        throw error;
    }
}


