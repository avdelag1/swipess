import { PerksDashboard } from '@/components/perks/PerksDashboard';
import { AmbientPageBackground } from '@/components/ui/AmbientPageBackground';

export default function ClientPerks() {
  return (
    <AmbientPageBackground className="min-h-screen flex flex-col">
      <PerksDashboard />
    </AmbientPageBackground>
  );
}