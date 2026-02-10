/**
 * Unified Notification System
 *
 * Provides consistent notification handling across the app using toast notifications.
 * Use these helper functions instead of calling toast() directly for better consistency.
 */

import { toast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, AlertCircle, Info, Flame, MessageCircle, Upload } from 'lucide-react';

export type NotificationType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'like'
  | 'message'
  | 'upload';

interface NotificationOptions {
  title: string;
  description?: string;
  duration?: number;
}

/**
 * Show a success notification (green)
 * Use for: Successful operations, confirmations
 */
export function showSuccess(options: NotificationOptions) {
  toast({
    title: options.title,
    description: options.description,
    variant: 'success',
    duration: options.duration || 3000,
  });
}

/**
 * Show an error notification (red)
 * Use for: Wrong password, failed operations, validation errors
 */
export function showError(options: NotificationOptions) {
  toast({
    title: options.title,
    description: options.description,
    variant: 'destructive',
    duration: options.duration || 4000,
  });
}

/**
 * Show a warning notification (amber/orange)
 * Use for: Non-critical issues, confirmations needed
 */
export function showWarning(options: NotificationOptions) {
  toast({
    title: options.title,
    description: options.description,
    variant: 'warning',
    duration: options.duration || 3500,
  });
}

/**
 * Show an info notification (cyan/blue)
 * Use for: General information, updates, tips
 */
export function showInfo(options: NotificationOptions) {
  toast({
    title: options.title,
    description: options.description,
    variant: 'info',
    duration: options.duration || 3000,
  });
}

/**
 * Show a like notification (special styling)
 * Use for: Someone liked your listing/profile
 */
export function showLikeNotification(options: NotificationOptions) {
  toast({
    title: options.title,
    description: options.description,
    variant: 'success',
    duration: options.duration || 3000,
  });
}

/**
 * Show a message notification (special styling)
 * Use for: New messages received
 */
export function showMessageNotification(options: NotificationOptions) {
  toast({
    title: options.title,
    description: options.description,
    variant: 'info',
    duration: options.duration || 3000,
  });
}

/**
 * Show an upload notification
 * Use for: File upload progress/completion
 */
export function showUploadNotification(options: NotificationOptions) {
  toast({
    title: options.title,
    description: options.description,
    variant: 'default',
    duration: options.duration || 2500,
  });
}

// Common notification presets for frequently used scenarios

export const notifications = {
  // Auth related
  auth: {
    invalidEmail: () => showError({
      title: 'Invalid Email',
      description: 'Please enter a valid email address',
    }),
    wrongPassword: () => showError({
      title: 'Wrong Password',
      description: 'The password you entered is incorrect',
    }),
    signInSuccess: () => showSuccess({
      title: 'Signed In',
      description: 'Welcome back!',
      duration: 2000,
    }),
    signUpSuccess: () => showSuccess({
      title: 'Account Created',
      description: 'Welcome to Swipess!',
      duration: 2000,
    }),
    signOutSuccess: () => showInfo({
      title: 'Signed Out',
      description: 'See you soon!',
      duration: 2000,
    }),
  },

  // Listing related
  listing: {
    created: (category: string) => showSuccess({
      title: 'Listing Created!',
      description: `Your ${category} is now live`,
      duration: 2000,
    }),
    updated: (category: string) => showSuccess({
      title: 'Listing Updated!',
      description: `Your ${category} has been updated`,
      duration: 2000,
    }),
    deleted: () => showInfo({
      title: 'Listing Deleted',
      description: 'Your listing has been removed',
      duration: 2000,
    }),
    uploadStarted: () => showUploadNotification({
      title: 'Uploading Photos...',
      description: 'Please wait while we upload your images',
      duration: 2000,
    }),
    uploadComplete: () => showSuccess({
      title: 'Upload Complete',
      description: 'All photos uploaded successfully',
      duration: 2000,
    }),
    missingPhotos: () => showError({
      title: 'Photos Required',
      description: 'Please add at least one photo',
    }),
  },

  // Social interactions
  social: {
    newLike: (name?: string) => showLikeNotification({
      title: 'New Like!',
      description: name ? `${name} liked your listing` : 'Someone liked your listing',
    }),
    newMessage: (name?: string) => showMessageNotification({
      title: 'New Message',
      description: name ? `${name} sent you a message` : 'You have a new message',
    }),
    newMatch: (name?: string) => showSuccess({
      title: 'It\'s a Match!',
      description: name ? `You matched with ${name}` : 'You have a new match',
    }),
  },

  // General app notifications
  app: {
    updateAvailable: () => showInfo({
      title: 'Update Available',
      description: 'A new version is available',
    }),
    offline: () => showWarning({
      title: 'No Internet Connection',
      description: 'Please check your connection',
    }),
    online: () => showSuccess({
      title: 'Back Online',
      description: 'Connection restored',
      duration: 2000,
    }),
  },
};
