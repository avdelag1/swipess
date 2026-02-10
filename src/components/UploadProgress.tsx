import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  className?: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  status,
  message,
  className,
}) => {
  if (status === 'idle') return null;

  return (
    <div className={cn('bg-black/90 backdrop-blur-sm rounded-lg p-4', className)}>
      <div className="flex items-center gap-3">
        {status === 'uploading' && (
          <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        )}
        {status === 'error' && (
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white text-sm font-medium">
              {status === 'uploading' && 'Uploading photo...'}
              {status === 'success' && 'Upload complete!'}
              {status === 'error' && 'Upload failed'}
            </span>
            {status === 'uploading' && (
              <span className="text-white/70 text-sm">{Math.round(progress)}%</span>
            )}
          </div>

          {status === 'uploading' && (
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {message && (
            <p className="text-white/70 text-xs mt-1">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
