import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import PhotoCamera from '@/components/PhotoCamera';
import UploadProgress from '@/components/UploadProgress';
import { usePhotoCamera } from '@/hooks/usePhotoCamera';

export default function OwnerProfileCamera() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const returnPath = (location.state as { returnPath?: string })?.returnPath || '/owner/profile';

  const { uploadProgress, uploadStatus, uploadMessage, handleCapture } = usePhotoCamera(user?.id || '');

  const onCapture = useCallback(async (originalBlob: Blob, croppedBlob: Blob) => {
    try {
      await handleCapture(originalBlob, croppedBlob);
      toast({
        title: 'Profile Photo Updated!',
        description: 'Your new photo has been saved as your profile photo.',
      });
      navigate(returnPath);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to save your photo. Please try again.',
        variant: 'destructive',
      });
    }
  }, [handleCapture, navigate, returnPath]);

  const onClose = useCallback(() => {
    navigate(returnPath);
  }, [navigate, returnPath]);

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <PhotoCamera
        mode="front"
        onCapture={onCapture}
        onClose={onClose}
        autoStart={true}
      />
      {uploadStatus !== 'idle' && (
        <div className="fixed bottom-4 left-4 right-4 z-[60]">
          <UploadProgress
            progress={uploadProgress}
            status={uploadStatus}
            message={uploadMessage}
          />
        </div>
      )}
    </>
  );
}
