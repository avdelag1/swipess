import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, X } from 'lucide-react';
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
    if (!selectedReportType) return;
    await createReport.mutateAsync({
      reportedUserId,
      reportedListingId,
      reportType: selectedReportType as ReportType,
      reportCategory: category,
      description,
    });
    setSelectedReportType('');
    setDescription('');
    onOpenChange(false);
  };

  const getRelevantReportTypes = (): ReportType[] => {
    if (category === 'listing') {
      return ['fake_listing', 'not_real_owner', 'misleading_info', 'inappropriate_content', 'scam', 'spam', 'other'];
    } else if (category === 'user_profile') {
      return ['fake_profile', 'not_real_owner', 'broker_posing_as_client', 'broker_posing_as_owner', 'inappropriate_content', 'harassment', 'scam', 'spam', 'other'];
    }
    return ['inappropriate_content', 'harassment', 'spam', 'other'];
  };

  const relevantReportTypes = getRelevantReportTypes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className={cn(
          "max-w-md w-[calc(100vw-32px)] p-0 rounded-[28px] border shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col",
          isLight ? "bg-white border-slate-200" : "bg-[#0A0A0A] border-white/10"
        )}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header */}
          <div className={cn("shrink-0 p-5 pb-4 border-b", isLight ? "border-slate-200" : "border-white/[0.05]")}>
            <DialogHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center border",
                    isLight ? "bg-rose-50 border-rose-200" : "bg-rose-950/30 border-rose-800/50"
                  )}>
                    <Flag className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className={cn("text-lg font-bold tracking-tight", isLight ? "text-slate-900" : "text-white")}>
                      Report {category === 'listing' ? 'Listing' : category === 'user_profile' ? 'User' : 'Content'}
                    </DialogTitle>
                    <div className={cn("text-[10px] font-bold uppercase tracking-[0.18em] mt-0.5", isLight ? "text-slate-500" : "text-white/50")}>
                      Trust & Safety
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all",
                    isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                            : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <DialogDescription className={cn("text-xs leading-relaxed", isLight ? "text-slate-500" : "text-white/50")}>
                Help us keep Swipess safe. Your report is confidential.
                {(reportedUserName || reportedListingTitle) && (
                  <span className={cn(
                    "block mt-2.5 p-3 rounded-xl border text-xs font-medium",
                    isLight ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-[#111111] border-white/10 text-white/70"
                  )}>
                    Subject: {reportedUserName || reportedListingTitle}
                    {reportedUserAge && <span className="ml-2">• {reportedUserAge} years</span>}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div className="space-y-3">
                <Label className={cn("text-[10px] font-bold uppercase tracking-[0.18em] ml-1", isLight ? "text-slate-500" : "text-white/50")}>
                  Select Reason
                </Label>
                <RadioGroup value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType | '')}>
                  <div className="space-y-2">
                    {relevantReportTypes.map((type) => (
                      <Label
                        key={type}
                        htmlFor={type}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                          selectedReportType === type
                            ? (isLight ? "bg-rose-50 border-rose-500 shadow-sm" : "bg-rose-950/20 border-rose-500")
                            : (isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300" : "bg-[#121212] border-white/10 hover:border-white/20")
                        )}
                      >
                        <div className="mt-0.5">
                          <RadioGroupItem
                            value={type}
                            id={type}
                            className={cn(
                              selectedReportType === type
                                ? "border-rose-600 text-rose-600"
                                : (isLight ? "border-slate-400" : "border-white/40")
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <div className={cn(
                            "text-sm font-semibold tracking-tight",
                            selectedReportType === type
                              ? (isLight ? "text-rose-700" : "text-rose-400")
                              : (isLight ? "text-slate-900" : "text-white/90")
                          )}>
                            {REPORT_TYPE_LABELS[type]}
                          </div>
                          <div className={cn("text-xs mt-0.5 leading-snug", isLight ? "text-slate-500" : "text-white/50")}>
                            {REPORT_TYPE_DESCRIPTIONS[type]}
                          </div>
                        </div>
                      </Label>
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
                    <Label htmlFor="description" className={cn("text-[10px] font-bold uppercase tracking-[0.18em] ml-1", isLight ? "text-slate-500" : "text-white/50")}>
                      Evidence Details <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide specific details about the incident..."
                      className={cn(
                        "min-h-[110px] rounded-2xl p-3.5 text-sm resize-none focus-visible:ring-1 focus-visible:ring-rose-500 transition-all border",
                        isLight ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                                : "bg-[#161616] border-white/10 text-white placeholder:text-white/30"
                      )}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={cn(
              "shrink-0 flex gap-2.5 p-5 pt-4 border-t",
              isLight ? "border-slate-200 bg-white" : "border-white/[0.05] bg-[#0A0A0A]"
            )}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex-1 h-12 rounded-2xl font-semibold text-sm transition-all",
                  isLight ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                          : "bg-white/10 border-white/20 text-white hover:bg-white/15"
                )}
                disabled={createReport.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={cn(
                  "flex-1 h-12 rounded-2xl font-bold text-sm border-0 transition-all shadow-lg active:scale-[0.98]",
                  "bg-rose-600 hover:bg-rose-500 !text-white shadow-rose-600/20",
                  "disabled:bg-rose-300 disabled:!text-white disabled:opacity-100 disabled:shadow-none"
                )}
                disabled={!selectedReportType || !description.trim() || createReport.isPending}
              >
                {createReport.isPending ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
