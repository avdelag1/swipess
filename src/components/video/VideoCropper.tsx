import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PremiumButton } from '@/visual/PremiumButton';
import { Scissors, Play, Pause, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadListingVideo } from '@/utils/videoUpload';
const MAX_DURATION = 10; // 10 seconds max

interface VideoCropperProps {
    isOpen: boolean;
    onClose: () => void;
    videoFile: File | null;
    userId: string;
    onUploadSuccess: (url: string) => void;
}

export function VideoCropper({
    isOpen,
    onClose,
    videoFile,
    userId,
    onUploadSuccess,
}: VideoCropperProps) {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(MAX_DURATION);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setVideoUrl(null);
        }
    }, [videoFile]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (video.currentTime >= endTime) {
                video.currentTime = startTime; // Loop
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [startTime, endTime]);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const vidDuration = videoRef.current.duration;
            setDuration(vidDuration);
            setEndTime(Math.min(vidDuration, MAX_DURATION));
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.currentTime = startTime;
                videoRef.current.play().catch(console.error);
            }
            setIsPlaying(!isPlaying);
        }
    };

    const processAndUpload = async () => {
        if (!videoRef.current || !videoUrl) return;
        setIsProcessing(true);
        toast.info('Cropping and preparing video... Please do not close.');

        try {
            const video = videoRef.current;
            video.pause();
            setIsPlaying(false);
            video.currentTime = startTime;

            // Capture stream from video element, then strip audio tracks for smaller files
            const rawStream = (video as any).captureStream
                ? (video as any).captureStream()
                : (video as any).mozCaptureStream
                    ? (video as any).mozCaptureStream()
                    : null;

            if (!rawStream) {
                throw new Error("Your browser does not support local video cropping. Please try another browser.");
            }

            // ✂️ Strip all audio tracks — reduces file size by ~40-60%
            const videoOnlyTracks = (rawStream as MediaStream).getVideoTracks();
            const stream = new MediaStream(videoOnlyTracks);

            const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
                ? 'video/webm; codecs=vp9'
                : 'video/webm';

            // 🎯 Cap bitrate at 1.5 Mbps — sufficient for 720p mobile viewing
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 1_500_000,
            });
            recordedChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                try {
                    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                    toast.success('Cropped locally! Uploading now...');
                    const url = await uploadListingVideo(userId, blob);
                    toast.success('Video uploaded successfully!');
                    onUploadSuccess(url);
                    onClose();
                } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Error uploading video');
                } finally {
                    setIsProcessing(false);
                }
            };

            video.play().catch(console.error);
            mediaRecorderRef.current.start();

            // Stop recording after the exact duration length
            const segmentDuration = (endTime - startTime) * 1000;
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }
                video.pause();
            }, segmentDuration);

        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error processing video.');
            setIsProcessing(false);
        }
    };

    if (!videoFile || !videoUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
            <DialogContent className="sm:max-w-md bg-black/95 border-white/10 p-0 overflow-hidden hide-dialog-close">
                <div className="relative w-full aspect-[9/16] max-h-[70vh] bg-black flex items-center justify-center">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        onLoadedMetadata={handleLoadedMetadata}
                        playsInline
                        muted
                        loop={false}
                    />

                    {/* Controls overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-6">

                        <button
                            onClick={togglePlay}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-transform active:scale-95"
                        >
                            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                        </button>

                        {/* Custom Slider */}
                        <div className="mb-6 space-y-4">
                            <div className="flex justify-between text-xs font-semibold text-white/70">
                                <span>Selected: {(endTime - startTime).toFixed(1)}s (Max {MAX_DURATION}s)</span>
                                <span>Total: {duration.toFixed(1)}s</span>
                            </div>

                            <div className="relative h-2 bg-white/20 rounded-full w-full">
                                {/* Active track */}
                                <div
                                    className="absolute h-full bg-[var(--color-brand-accent-2)] rounded-full"
                                    style={{
                                        left: `${(startTime / duration) * 100}%`,
                                        width: `${((endTime - startTime) / duration) * 100}%`
                                    }}
                                />

                                {/* Start Thumb */}
                                <input
                                    type="range"
                                    min={0}
                                    max={duration}
                                    step={0.1}
                                    value={startTime}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (val < endTime - 0.5) {
                                            setStartTime(val);
                                            if (endTime - val > MAX_DURATION) setEndTime(val + MAX_DURATION);
                                            if (videoRef.current) videoRef.current.currentTime = val;
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-20"
                                />
                                <div
                                    className="absolute top-1/2 -mt-2.5 w-5 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(228,0,124,0.5)] border border-white/20 pointer-events-none z-10"
                                    style={{ left: `calc(${(startTime / duration) * 100}% - 10px)` }}
                                />

                                {/* End Thumb */}
                                <input
                                    type="range"
                                    min={0}
                                    max={duration}
                                    step={0.1}
                                    value={endTime}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (val > startTime + 0.5) {
                                            setEndTime(val);
                                            if (val - startTime > MAX_DURATION) setStartTime(val - MAX_DURATION);
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-30"
                                />
                                <div
                                    className="absolute top-1/2 -mt-2.5 w-5 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(228,0,124,0.5)] border border-white/20 pointer-events-none z-10"
                                    style={{ left: `calc(${(endTime / duration) * 100}% - 10px)` }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <PremiumButton
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                                disabled={isProcessing}
                            >
                                Cancel
                            </PremiumButton>
                            <PremiumButton
                                variant="luxury"
                                className="flex-1"
                                onClick={processAndUpload}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Scissors className="w-4 h-4" /> Loop & Save
                                    </span>
                                )}
                            </PremiumButton>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


