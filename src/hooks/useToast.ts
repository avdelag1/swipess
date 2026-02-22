// Unified toast hook - wraps sonner with backwards compatibility
import { toast } from '@/components/ui/sonner';

export function useToast() {
  return { toast };
}

export { toast };
