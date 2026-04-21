import { useState, useRef } from 'react';
import { VideoCropper } from './VideoCropper';
import { Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ListingVideoUploadProps {
    userId: string;
    videoUrl?: string | null;
    onUploadSuccess: (url: string) => void;
    onRemove: () => void;
    className?: string;
}

export function ListingVideoUpload({
    userId,
    videoUrl,
    onUploadSuccess,
    onRemove,
    className
}: ListingVideoUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Please select a valid video file.');
            return;
        }

        // 50MB max file size just to be safe before we crop
        if (file.size > 50 * 1024 * 1024) {
            toast.error('Video is too large. Please select a video under 50MB.');
            return;
        }

        setSelectedFile(file);
        setIsCropperOpen(true);
        // Reset input so the same file could be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={cn("w-full", className)}>
            <input
                type="file"
                ref={fileInputRef}
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleFileSelect}
            />

            {videoUrl ? (
                <div className="relative w-full aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden border border-white/10 group bg-black/50">
                    <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                            type="button"
                            onClick={onRemove}
                            className="p-3 rounded-full bg-red-500/80 text-white hover:bg-red-500 hover:scale-105 active:scale-95 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5 text-xs font-semibold text-white/90">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-accent-2)] animate-pulse" />
                        10s Loop
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video sm:aspect-[4/1] rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-[var(--color-brand-accent-2)]/50 transition-all flex flex-col items-center justify-center gap-3 group text-white/60 hover:text-white"
                >
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <Video className="w-5 h-5 text-[var(--color-brand-accent-2)]" />
                    </div>
                    <div className="text-center px-4">
                        <p className="font-semibold text-sm">Upload Looping Video</p>
                        <p className="text-xs text-white/40 mt-1 max-w-[250px] mx-auto">Upload a video to create a 10-second boomerang. Stand out to clients!</p>
                    </div>
                </button>
            )}

            {selectedFile && (
                <VideoCropper
                    isOpen={isCropperOpen}
                    onClose={() => {
                        setIsCropperOpen(false);
                        setSelectedFile(null);
                    }}
                    videoFile={selectedFile}
                    userId={userId}
                    onUploadSuccess={(url) => {
                        onUploadSuccess(url);
                        setSelectedFile(null);
                    }}
                />
            )}
        </div>
    );
}

