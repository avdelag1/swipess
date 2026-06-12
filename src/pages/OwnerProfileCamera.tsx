import { useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { appToast } from '@/utils/appNotification';
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
      appToast.info('Profile Photo Updated!', 'Your new photo has been saved as your profile photo.');
      navigate(returnPath);
    } catch (_error) {
      appToast.error('Upload Failed', 'Failed to save your photo. Please try again.');
    }
  }, [handleCapture, navigate, returnPath]);

  const onClose = useCallback(() => {
    navigate(returnPath);
  }, [navigate, returnPath]);

  if (!user) {
    return <Navigate to="/" replace />;
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
        <div className="fixed left-4 right-4 z-[60]" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
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


