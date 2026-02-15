// Wrapper component for SubscriptionPackages - used for message activation flow
import { SubscriptionPackages } from './SubscriptionPackages';

interface MessageActivationPackagesProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'client' | 'owner' | 'admin';
}

export function MessageActivationPackages({
  isOpen,
  onClose,
  userRole,
}: MessageActivationPackagesProps) {
  return (
    <SubscriptionPackages
      isOpen={isOpen}
      onClose={onClose}
      userRole={userRole}
      reason="message-activation"
    />
  );
}
