

# Fix: Missing `Zap` import in ConciergeChat.tsx

## Problem
`ConciergeChat.tsx` uses the `Zap` icon from lucide-react on lines 501 and 778 (to show the MiniMax lightning bolt badge), but `Zap` is not included in the import statement at the top of the file. This causes two TypeScript build errors.

## Fix (1 file, 1 line)
**`src/components/ConciergeChat.tsx` line 8** — Add `Zap` to the existing lucide-react import:

```typescript
import {
  Send,
  X,
  Sparkles,
  MapPin,
  Building2,
  Car,
  User,
  Trash2,
  ChevronRight,
  Brain,
  Utensils,
  Calendar,
  MessageCircle as _ChatIcon,
  ChevronsUp,
  ChevronsDown,
  Copy,
  RefreshCcw,
  Shield,
  Navigation,
  Phone,
  ExternalLink,
  Zap,
} from 'lucide-react';
```

That's it — one missing import. Everything else (backend config, AI routing) is already correctly wired.

