import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'h',
        altKey: true,
        action: () => navigate('/'),
        description: 'Go to home'
      },
      {
        key: 'd',
        altKey: true,
        action: () => {
          if (user) {
            const role = user.user_metadata?.role;
            navigate(role === 'owner' ? '/owner/dashboard' : '/client/dashboard');
          }
        },
        description: 'Go to dashboard'
      },
      {
        key: 'p',
        altKey: true,
        action: () => {
          if (user) {
            const role = user.user_metadata?.role;
            navigate(role === 'owner' ? '/owner/profile' : '/client/profile');
          }
        },
        description: 'Go to profile'
      },
      {
        key: 's',
        altKey: true,
        action: () => {
          if (user) {
            const role = user.user_metadata?.role;
            navigate(role === 'owner' ? '/owner/settings' : '/client/settings');
          }
        },
        description: 'Go to settings'
      },
      {
        key: 'm',
        altKey: true,
        action: () => navigate('/messages'),
        description: 'Go to messages'
      },
      {
        key: '/',
        ctrlKey: true,
        action: () => {
          // Show keyboard shortcuts help
        },
        description: 'Show keyboard shortcuts'
      }
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => 
        s.key && event.key && s.key.toLowerCase() === event.key.toLowerCase() &&
        !!s.ctrlKey === event.ctrlKey &&
        !!s.altKey === event.altKey &&
        !!s.shiftKey === event.shiftKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, user]);

  return null;
}