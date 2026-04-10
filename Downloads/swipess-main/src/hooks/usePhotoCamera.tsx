import { useState } from 'react';
import { uploadProfilePhoto } from '@/utils/photoUpload';

export interface PhotoCameraState {
  isOpen: boolean;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadMessage?: string;
}

export const usePhotoCamera = (userId: string) => {
  const [state, setState] = useState<PhotoCameraState>({
    isOpen: false,
    uploadProgress: 0,
    uploadStatus: 'idle',
  });

  const openCamera = () => {
    setState({
      isOpen: true,
      uploadProgress: 0,
      uploadStatus: 'idle',
    });
  };

  const closeCamera = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCapture = async (originalBlob: Blob, croppedBlob: Blob) => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      uploadStatus: 'uploading',
      uploadProgress: 0,
    }));

    try {
      const photoUrl = await uploadProfilePhoto(
        userId,
        croppedBlob,
        (progress) => {
          setState(prev => ({ ...prev, uploadProgress: progress }));
        }
      );

      setState(prev => ({
        ...prev,
        uploadStatus: 'success',
        uploadProgress: 100,
        uploadMessage: 'Photo updated successfully!',
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, uploadStatus: 'idle' }));
      }, 2000);

      return photoUrl;
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploadStatus: 'error',
        uploadMessage: error instanceof Error ? error.message : 'Upload failed',
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, uploadStatus: 'idle' }));
      }, 3000);

      throw error;
    }
  };

  return {
    ...state,
    openCamera,
    closeCamera,
    handleCapture,
  };
};
