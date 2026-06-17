import { useNavigate } from 'react-router-dom';
import { useActiveMode } from '@/hooks/useActiveMode';
import { SubscriptionPackages } from '@/components/SubscriptionPackages';

export default function SubscriptionPackagesPage() {
  const navigate = useNavigate();
  const { activeMode } = useActiveMode();

  return (
    <SubscriptionPackages
      isOpen
      showAsPage
      userRole={activeMode}
      onClose={() => navigate(`/${activeMode}/dashboard`)}
    />
  );
}