import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportDialog } from './SupportDialog';

interface SupportButtonProps {
  userRole: 'client' | 'owner';
}

export function SupportButton({ userRole }: SupportButtonProps) {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowSupport(true)}
        variant="outline"
        size="sm"
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Support
      </Button>

      <SupportDialog
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
        userRole={userRole}
      />
    </>
  );
}