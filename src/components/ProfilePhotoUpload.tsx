import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, User, Upload, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  onPhotoUpdate?: (url: string) => void;
  className?: string;
  userRole?: 'client' | 'owner';
}

export function ProfilePhotoUpload({
  currentPhotoUrl,
  size = 'md',
  onPhotoUpdate,
  className = '',
  userRole = 'client',
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(currentPhotoUrl);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch current photo from profiles table on mount
  useEffect(() => {
    const fetchPhoto = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, profile_photo_url')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data && !error) {
        const url = data.avatar_url || data.profile_photo_url;
        if (url) {
          setPhotoUrl(url);
          onPhotoUpdate?.(url);
        }
      }
    };
    
    fetchPhoto();
  }, [user, onPhotoUpdate]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile with new photo URL in both columns
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          profile_photo_url: publicUrl 
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Also update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
          profile_photo_url: publicUrl
        }
      });

      if (metadataError) {
        logger.error('Error updating user metadata:', metadataError);
      }

      setPhotoUrl(publicUrl);
      onPhotoUpdate?.(publicUrl);
      
      toast({
        title: 'Success!',
        description: 'Profile photo updated successfully.',
      });

    } catch (error) {
      logger.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenCamera = () => {
    const cameraPath = userRole === 'client' ? '/client/camera' : '/owner/camera';
    navigate(cameraPath, { state: { returnPath: location.pathname } });
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="profile-photo-upload"
        disabled={isUploading}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="cursor-pointer block focus:outline-none">
            <div className="relative group">
              <Avatar className={`${sizeClasses[size]} border-2 border-white/20 shadow-lg`}>
                <AvatarImage src={photoUrl || currentPhotoUrl} alt="Profile" />
                <AvatarFallback className="bg-white/20 text-white">
                  <User className={`w-${size === 'sm' ? '4' : size === 'md' ? '6' : '8'} h-${size === 'sm' ? '4' : size === 'md' ? '6' : '8'}`} />
                </AvatarFallback>
              </Avatar>

              {/* Upload overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className={`w-${size === 'sm' ? '3' : '4'} h-${size === 'sm' ? '3' : '4'} text-white`} />
                )}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={handleOpenCamera} className="cursor-pointer">
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => document.getElementById('profile-photo-upload')?.click()}
            className="cursor-pointer"
          >
            <Image className="w-4 h-4 mr-2" />
            Choose from Gallery
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}