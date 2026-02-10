import { Badge } from '@/components/ui/badge';
import { Flame, Star, Zap } from 'lucide-react';

interface MatchPercentageBadgeProps {
  percentage: number;
  reasons?: string[];
  className?: string;
}

export function MatchPercentageBadge({ percentage, reasons, className }: MatchPercentageBadgeProps) {
  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400';
    if (percentage >= 70) return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400';
    if (percentage >= 50) return 'bg-gradient-to-r from-red-600 to-yellow-500 text-white border-red-400';
    if (percentage >= 30) return 'bg-gradient-to-r from-amber-500 to-red-500 text-white border-amber-400';
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400';
  };

  const getMatchIcon = (percentage: number) => {
    if (percentage >= 90) return <Star className="w-3 h-3 fill-current" />;
    if (percentage >= 70) return <Flame className="w-3 h-3 fill-current" />;
    if (percentage >= 50) return <Zap className="w-3 h-3" />;
    return null;
  };

  const getMatchText = (percentage: number) => {
    if (percentage >= 90) return 'Perfect Match';
    if (percentage >= 70) return 'Great Match';
    if (percentage >= 50) return 'Good Match';
    if (percentage >= 30) return 'Possible Match';
    return 'Low Match';
  };

  return (
    <Badge 
      className={`
        ${getMatchColor(percentage)} 
        ${className} 
        gap-1 px-2 py-1 text-xs font-semibold
        shadow-lg hover:shadow-xl transition-all duration-300
        border-2
      `}
      title={reasons?.join(', ') || ''}
    >
      {getMatchIcon(percentage)}
      {percentage}% {getMatchText(percentage)}
    </Badge>
  );
}