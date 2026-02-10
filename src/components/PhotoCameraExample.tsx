import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from './ui/button';
import PhotoCamera from './PhotoCamera';
import UploadProgress from './UploadProgress';
import { usePhotoCamera } from '@/hooks/usePhotoCamera';
import { useAuth } from '@/hooks/useAuth';

const PhotoCameraExample = () => {
  const { user } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const { uploadProgress, uploadStatus, uploadMessage, handleCapture } = usePhotoCamera(user?.id || '');

  const onCapture = async (originalBlob: Blob, croppedBlob: Blob) => {
    try {
      await handleCapture(originalBlob, croppedBlob);
      setShowCamera(false);
    } catch (error) {
      // Error is already handled by usePhotoCamera hook
    }
  };

  return (
    <div className="p-4">
      <Button onClick={() => setShowCamera(true)} className="gap-2">
        <Camera className="h-5 w-5" />
        Take Photo
      </Button>

      {showCamera && (
        <PhotoCamera
          mode="front"
          onCapture={onCapture}
          onClose={() => setShowCamera(false)}
          autoStart={true}
        />
      )}

      {uploadStatus !== 'idle' && (
        <div className="mt-4">
          <UploadProgress
            progress={uploadProgress}
            status={uploadStatus}
            message={uploadMessage}
          />
        </div>
      )}
    </div>
  );
};

export default PhotoCameraExample;
