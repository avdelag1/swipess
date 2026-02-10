import { useNavigate } from 'react-router-dom';
import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bookmark,
  FileText,
  Crown,
  HelpCircle,
  Users,
  Flame,
  Filter,
  ChevronRight,
  Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SettingsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'client' | 'owner';
  onMenuItemClick: (action: string) => void;
}

interface MenuItem {
  title: string;
  icon: React.ElementType;
  action?: string;
  path?: string;
  badge?: number;
  children?: MenuItem[];
}

export function SettingsBottomSheet({
  isOpen,
  onClose,
  userRole,
  onMenuItemClick
}: SettingsBottomSheetProps) {
  const navigate = useNavigate();

  const clientMenuItems: MenuItem[] = [
    {
      title: 'Saved Searches',
      icon: Bookmark,
      action: 'saved-searches',
    },
    {
      title: 'Security',
      icon: Shield,
      path: '/client/security',
    },
    {
      title: 'Contracts',
      icon: FileText,
      path: '/client/contracts',
    },
    {
      title: 'Legal Documents',
      icon: FileText,
      action: 'legal-documents',
    },
    {
      title: 'Premium Packages',
      icon: Crown,
      action: 'premium-packages',
    },
    {
      title: 'Support',
      icon: HelpCircle,
      action: 'support',
    },
  ];

  const ownerMenuItems: MenuItem[] = [
    {
      title: 'Liked Clients',
      icon: Flame,
      path: '/owner/liked-clients',
    },
    {
      title: 'Security',
      icon: Shield,
      path: '/owner/security',
    },
    {
      title: 'Contracts',
      icon: FileText,
      path: '/owner/contracts',
    },
    {
      title: 'Legal Documents',
      icon: FileText,
      action: 'legal-documents',
    },
    {
      title: 'Premium Packages',
      icon: Crown,
      action: 'premium-packages',
    },
    {
      title: 'Support',
      icon: HelpCircle,
      action: 'support',
    },
  ];

  const menuItems = userRole === 'client' ? clientMenuItems : ownerMenuItems;

  const handleItemClick = (item: MenuItem) => {
    if (item.action) {
      onMenuItemClick(item.action);
    } else if (item.path) {
      navigate(item.path);
    }
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="More Options"
      height="large"
    >
      <div className="space-y-2 pb-6">
        {/* Menu Items Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
            Menu
          </h3>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={`menu-${item.title}`}>
                {item.children ? (
                  // Parent item with children
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-3 text-foreground">
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1 font-medium">{item.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="pl-8 space-y-1">
                      {item.children.map((child) => (
                        <Button
                          key={`child-${child.title}`}
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12"
                          onClick={() => handleItemClick(child)}
                        >
                          <child.icon className="h-4 w-4" />
                          <span className="flex-1 text-left">{child.title}</span>
                          {child.badge && child.badge > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                              {child.badge}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Regular menu item
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => handleItemClick(item)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left font-medium">{item.title}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Footer Info */}
        <div className="px-2 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            <span className="swipess-text text-sm">Swipess</span> <span className="opacity-60">v1.0</span>
          </p>
        </div>
      </div>
    </BottomSheet>
  );
}
