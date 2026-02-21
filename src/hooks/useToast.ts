// Unified toast hook - wraps sonner for compatibility with existing code
import { toast } from 'sonner';

export function useToast() {
  return { toast };
}
