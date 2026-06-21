import { Navigate } from 'react-router-dom';
import { useActiveMode } from '@/hooks/useActiveMode';
import { getLegalSectionPath } from '@/utils/legalRoutes';

export default function LegalVaultRedirect() {
  const { activeMode } = useActiveMode();
  const role = activeMode === 'owner' ? 'owner' : 'client';
  return <Navigate to={getLegalSectionPath(role, 'vault')} replace />;
}