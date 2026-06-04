import React from 'react';
import { renderToString } from 'react-dom/server';
import { SwipeInsightsModal } from './src/components/SwipeInsightsModal';
import { PropertyImageGallery } from './src/components/PropertyImageGallery';
import { ShareDialog } from './src/components/ShareDialog';
import { ReportDialog } from './src/components/ReportDialog';

try {
  console.log("Testing SwipeInsightsModal...");
  renderToString(<SwipeInsightsModal open={true} onOpenChange={() => {}} listing={{ id: 1, title: 'test', price: 100 }} />);
  console.log("SwipeInsightsModal rendered successfully!");
} catch (e) {
  console.error("Crash in SwipeInsightsModal:", e);
}

try {
  console.log("Testing ShareDialog...");
  renderToString(<ShareDialog open={true} onOpenChange={() => {}} url="http://test.com" />);
  console.log("ShareDialog rendered successfully!");
} catch (e) {
  console.error("Crash in ShareDialog:", e);
}

try {
  console.log("Testing ReportDialog...");
  renderToString(<ReportDialog open={true} onOpenChange={() => {}} listingId="123" />);
  console.log("ReportDialog rendered successfully!");
} catch (e) {
  console.error("Crash in ReportDialog:", e);
}
