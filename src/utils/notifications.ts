/**
 * Unified Notification System
 *
 * Provides consistent notification handling across the app using the premium NotificationBar.
 * Use these helper functions instead of calling toast() directly for better consistency.
 */

import { showAppNotification } from '@/utils/appNotification';

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
  showAppNotification({ type: 'success', title: options.title, message: options.description });
}

/**
 * Show an error notification (red)
 * Use for: Wrong password, failed operations, validation errors
 */
export function showError(options: NotificationOptions) {
  showAppNotification({ type: 'error', title: options.title, message: options.description });
}

/**
 * Show a warning notification (amber/orange)
 * Use for: Non-critical issues, confirmations needed
 */
export function showWarning(options: NotificationOptions) {
  showAppNotification({ type: 'warning', title: options.title, message: options.description });
}

/**
 * Show an info notification (cyan/blue)
 * Use for: General information, updates, tips
 */
export function showInfo(options: NotificationOptions) {
  showAppNotification({ type: 'info', title: options.title, message: options.description });
}

/**
 * Show a like notification (special styling)
 * Use for: Someone liked your listing/profile
 */
export function showLikeNotification(options: NotificationOptions) {
  showAppNotification({ type: 'like', title: options.title, message: options.description });
}

/**
 * Show a message notification (special styling)
 * Use for: New messages received
 */
export function showMessageNotification(options: NotificationOptions) {
  showAppNotification({ type: 'message', title: options.title, message: options.description });
}

/**
 * Show an upload notification
 * Use for: File upload progress/completion
 */
export function showUploadNotification(options: NotificationOptions) {
  showAppNotification({ type: 'info', title: options.title, message: options.description });
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
    }),
    signUpSuccess: () => showSuccess({
      title: 'Account Created',
      description: 'Welcome aboard!',
    }),
    signOutSuccess: () => showInfo({
      title: 'Signed Out',
      description: 'See you soon!',
    }),
  },

  // Listing related
  listing: {
    created: (category: string) => showSuccess({
      title: 'Listing Created!',
      description: `Your ${category} is now live`,
    }),
    updated: (category: string) => showSuccess({
      title: 'Listing Updated!',
      description: `Your ${category} has been updated`,
    }),
    deleted: () => showInfo({
      title: 'Listing Deleted',
      description: 'Your listing has been removed',
    }),
    uploadStarted: () => showUploadNotification({
      title: 'Uploading Photos...',
      description: 'Please wait while we upload your images',
    }),
    uploadComplete: () => showSuccess({
      title: 'Upload Complete',
      description: 'All photos uploaded successfully',
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
    }),
  },
};


