import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSwipeAnalytics } from '@/hooks/useSwipeAnalytics';
import { 
  TrendingUp, 
  Flame, 
  X, 
  Zap, 
  Clock, 
  Target,
  BarChart3,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface SwipeInsightsProps {
  userRole: 'client' | 'owner';
  isOpen: boolean;
  onClose: () => void;
}

export function SwipeInsights({ userRole, isOpen, onClose }: SwipeInsightsProps) {
  const { metrics, getDailyBreakdown, getInsights } = useSwipeAnalytics(userRole);
  
  if (!isOpen) return null;

  const dailyData = getDailyBreakdown();
  const insights = getInsights();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'tip': return <Target className="w-5 h-5 text-blue-400" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border-b border-white/10 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center ring-2 ring-red-500/30">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Swipe Analytics</h2>
                <p className="text-sm text-gray-400">Your activity insights</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-white/70 hover:text-white h-11 w-11 rounded-full hover:bg-white/10">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/15 to-blue-600/10 backdrop-blur-sm border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 flex items-center justify-center ring-2 ring-blue-500/30">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics?.totalSwipes || 0}</div>
                <div className="text-gray-400 text-sm font-medium">Total Swipes</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/15 to-orange-600/10 backdrop-blur-sm border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-red-500/30 to-orange-600/20 flex items-center justify-center ring-2 ring-red-500/30">
                  <Flame className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics?.likesGiven || 0}</div>
                <div className="text-gray-400 text-sm font-medium">Likes Given</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/15 to-emerald-600/10 backdrop-blur-sm border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-600/20 flex items-center justify-center ring-2 ring-green-500/30">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics?.matchRate || 0}%</div>
                <div className="text-gray-400 text-sm font-medium">Match Rate</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/15 to-pink-600/10 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-600/20 flex items-center justify-center ring-2 ring-purple-500/30">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics?.averageSessionTime || 0}m</div>
                <div className="text-gray-400 text-sm font-medium">Avg Session</div>
              </CardContent>
            </Card>
          </div>

          {/* Match Rate Progress */}
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg">Match Rate Progress</div>
                  <div className="text-sm text-gray-400 font-normal">Track your matching success</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Current Rate</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{metrics?.matchRate || 0}%</span>
                </div>
                <div className="relative">
                  <Progress value={metrics?.matchRate || 0} className="h-3 bg-white/10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full opacity-30 blur-sm"></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 font-medium">
                  <span>0%</span>
                  <span className="text-primary">Target: 25%</span>
                  <span>50%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-lg">7-Day Activity</div>
                  <div className="text-sm text-gray-400 font-normal">Your weekly performance</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyData.map((day, index) => (
                  <div key={`day-${day.date}`} className="flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-200">
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex gap-5 text-sm font-medium">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-blue-400">{day.swipes}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <span className="text-red-400">{day.likes}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-green-400">{day.matches}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Peak Activity */}
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-pink-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-lg">Activity Patterns</div>
                  <div className="text-sm text-gray-400 font-normal">When you're most active</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-purple-500/5 rounded-xl border border-primary/20">
                <span className="text-gray-300 font-medium">Peak Activity Time</span>
                <Badge className="bg-gradient-to-r from-primary to-purple-500 text-white border-none shadow-lg px-4 py-1.5 text-sm">{metrics?.peakActivity || '12:00'}</Badge>
              </div>

              <div>
                <span className="text-gray-400 text-sm font-medium mb-3 block">Top Categories</span>
                <div className="flex flex-wrap gap-2">
                  {metrics?.topCategories?.map((category) => (
                    <Badge key={`cat-${category}`} className="bg-white/10 hover:bg-white/15 text-white border-white/20 px-3 py-1.5 text-sm font-medium">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights & Recommendations */}
          {insights.length > 0 && (
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-lg">Insights & Tips</div>
                    <div className="text-sm text-gray-400 font-normal">Personalized recommendations</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={`insight-${insight.title}`} className="flex items-start gap-4 p-5 bg-gradient-to-r from-white/5 to-white/0 hover:from-white/10 hover:to-white/5 rounded-xl border border-white/10 transition-all duration-200">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center flex-shrink-0">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white mb-2">{insight.title}</h4>
                      <p className="text-gray-300 text-sm mb-3 leading-relaxed">{insight.message}</p>
                      <Button size="sm" className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-lg hover:shadow-primary/50 px-4">
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}