import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, Flag, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useCreateReport,
  ReportType,
  ReportCategory,
  REPORT_TYPE_LABELS,
  REPORT_TYPE_DESCRIPTIONS,
} from '@/hooks/useReporting';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedListingId?: string;
  reportedUserName?: string;
  reportedListingTitle?: string;
  category: ReportCategory;
}

export function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedListingId,
  reportedUserName,
  reportedListingTitle,
  category,
}: ReportDialogProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const createReport = useCreateReport();

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

  // Filter report types based on category
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Flag className="w-6 h-6 text-red-500" />
            Report{' '}
            {category === 'listing' ? 'Listing' : category === 'user_profile' ? 'User' : 'Content'}
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Your report will be reviewed by our moderation team.
            {(reportedUserName || reportedListingTitle) && (
              <span className="block mt-2 font-medium text-foreground">
                Reporting: {reportedUserName || reportedListingTitle}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Report Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">What's the problem?</Label>

            <RadioGroup value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType | '')}>
              <div className="space-y-3">
                {relevantReportTypes.map((type) => (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label
                      htmlFor={type}
                      className={`
                        flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${
                          selectedReportType === type
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                            : 'border-border hover:border-red-300 dark:hover:border-red-700'
                        }
                      `}
                    >
                      <RadioGroupItem value={type} id={type} className="mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">
                          {REPORT_TYPE_LABELS[type]}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {REPORT_TYPE_DESCRIPTIONS[type]}
                        </div>
                      </div>
                    </Label>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <AnimatePresence>
            {selectedReportType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="description" className="text-base font-semibold">
                  Please provide details <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail. The more information you provide, the better we can help."
                  className="min-h-[120px] resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your report is anonymous and will be reviewed within 24-48 hours.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Warning Alert */}
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> False reports may result in account suspension. Only submit
              reports for genuine concerns.
            </AlertDescription>
          </Alert>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Your Safety Matters</p>
              <p>
                All reports are confidential. The reported user will not know who submitted the
                report. Our moderation team investigates all reports thoroughly.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={createReport.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={!selectedReportType || !description.trim() || createReport.isPending}
            >
              {createReport.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
