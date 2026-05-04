import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, Shield, X } from 'lucide-react';
import {
  useCreateReport,
  ReportType,
  ReportCategory,
  REPORT_TYPE_LABELS,
  REPORT_TYPE_DESCRIPTIONS,
} from '@/hooks/useReporting';
import { motion, AnimatePresence } from 'framer-motion';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedListingId?: string;
  reportedUserName?: string;
  reportedListingTitle?: string;
  reportedUserAge?: number | string;
  category: ReportCategory;
}

export function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedListingId,
  reportedUserName,
  reportedListingTitle,
  reportedUserAge,
  category,
}: ReportDialogProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const createReport = useCreateReport();
  const { isLight } = useAppTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReportType) {
      return;
    }

    await createReport.mutateAsync({
      reportedUserId,
      reportedListingId,
      reportType: selectedReportType as ReportType,
      reportCategory: category,
      description,
    });

    // Reset form and close dialog
    setSelectedReportType('');
    setDescription('');
    onOpenChange(false);
  };

  const getRelevantReportTypes = (): ReportType[] => {
    if (category === 'listing') {
      return [
        'fake_listing',
        'not_real_owner',
        'misleading_info',
        'inappropriate_content',
        'scam',
        'spam',
        'other',
      ];
    } else if (category === 'user_profile') {
      return [
        'fake_profile',
        'not_real_owner',
        'broker_posing_as_client',
        'broker_posing_as_owner',
        'inappropriate_content',
        'harassment',
        'scam',
        'spam',
        'other',
      ];
    }
    return ['inappropriate_content', 'harassment', 'spam', 'other'];
  };

  const relevantReportTypes = getRelevantReportTypes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <div className={cn(
          "m-4 rounded-[1.5rem] border overflow-hidden shadow-2xl relative",
          isLight ? "bg-white border-black/10" : "bg-[#0A0A0A] border-white/10"
        )}>
          <div className="p-6 pb-4 relative z-10">
            <DialogHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", isLight ? "bg-rose-50 border-rose-200" : "bg-rose-950/30 border-rose-800/50")}>
                      <Flag className="w-5 h-5 text-rose-500" />
                   </div>
                   <div className="flex-1">
                      <DialogTitle className={cn("text-xl font-bold tracking-tight", isLight ? "text-black" : "text-white")}>
                        Report {category === 'listing' ? 'Listing' : category === 'user_profile' ? 'User' : 'Content'}
                      </DialogTitle>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-0.5">Nexus Security</div>
                   </div>
                </div>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => onOpenChange(false)}
                   className={cn("w-10 h-10 rounded-lg transition-all", isLight ? "bg-black text-white hover:bg-black/80" : "bg-white text-black hover:bg-white/80")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="text-[11px] font-bold uppercase tracking-wider opacity-60 leading-relaxed pt-1">
                Help us keep Swipess safe.
                {(reportedUserName || reportedListingTitle) && (
                  <span className={cn(
                    "block mt-3 p-3 rounded-lg border",
                    isLight ? "bg-stone-50 border-stone-200 text-stone-600" : "bg-[#111111] border-white/10 text-stone-400"
                  )}>
                    Subject: {reportedUserName || reportedListingTitle}
                    {reportedUserAge && (
                      <span className="ml-2">
                        • {reportedUserAge} years
                      </span>
                    )}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-8 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6 mt-2">
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Select Incident Type</Label>

                <RadioGroup value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType | '')}>
                  <div className="space-y-2">
                    {relevantReportTypes.map((type) => (
                      <div key={type}>
                        <Label
                          htmlFor={type}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                            selectedReportType === type
                              ? (isLight ? "bg-white border-rose-600 shadow-sm" : "bg-[#161616] border-rose-600 shadow-xl shadow-black")
                              : (isLight ? "bg-[#FDFDFD] border-black/10 hover:border-black/20" : "bg-[#121212] border-white/10 hover:border-white/20")
                          )}
                        >
                          <div className="mt-1">
                            <RadioGroupItem value={type} id={type} className={cn(selectedReportType === type ? "border-rose-600 text-rose-600" : (isLight ? "border-black/40" : "border-white/40"))} />
                          </div>
                          <div className="flex-1">
                            <div className={cn("text-xs font-black uppercase tracking-tight", selectedReportType === type ? "text-rose-600" : (isLight ? "text-white" : "text-stone-300"))}>
                              {REPORT_TYPE_LABELS[type]}
                            </div>
                            <div className="text-[10px] font-bold opacity-60 mt-0.5 leading-tight">
                              {REPORT_TYPE_DESCRIPTIONS[type]}
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <AnimatePresence>
                {selectedReportType && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="description" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">
                      Evidence Details <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide specific details about the incident..."
                      className={cn(
                        "min-h-[120px] rounded-xl p-4 text-xs font-bold resize-none focus-visible:ring-1 focus-visible:ring-rose-500 transition-all border",
                        isLight ? "bg-[#F9F9F9] border-black/10 text-black" : "bg-[#161616] border-white/10 text-white"
                      )}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className={cn("flex-1 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] border-2", isLight ? "border-black text-black hover:bg-black hover:text-white" : "border-white/20 text-white hover:bg-white hover:text-black")}
                  disabled={createReport.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] bg-rose-600 hover:bg-rose-500 text-white border-0 transition-all shadow-xl shadow-rose-900/20 active:scale-[0.98]"
                  disabled={!selectedReportType || !description.trim() || createReport.isPending}
                >
                  {createReport.isPending ? 'Reporting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
