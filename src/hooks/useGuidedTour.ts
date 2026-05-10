import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGuidedTourActive } from '@/state/guidedTourStore';

const TOUR_KEY = 'guidedTourCompleted';

export interface TourStep {
  target: string; // CSS selector — use 'body' for centered welcome
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  navigateTo?: string; // optional path to navigate before showing
  welcome?: boolean; // if true, render as centered modal (no spotlight)
}

const eliteSteps: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to the Nexus',
    description: 'I am your AI Concierge. Let me guide you through the elite sections of Swipess.',
    welcome: true,
  },
  {
    target: '[data-tour="radio-tuner"], [data-tour="radio"], [data-radio-tuner]',
    title: 'The Vibe',
    description: 'Atmosphere is everything. Tune into our global radio while you discover elite assets.',
    navigateTo: '/radio',
    position: 'bottom',
  },
  {
    target: '[data-tour="profile-photos"], [data-tour="profile"]',
    title: 'Your Identity',
    description: 'Your profile is your digital key. Upload your best photos to build trust and connect.',
    navigateTo: '/client/profile',
    position: 'bottom',
  },
  {
    target: '[data-tour="filters-pill"], [data-tour="filters"]',
    title: 'The Discovery',
    description: 'Precision is power. Use these filters to find exactly what you are looking for.',
    navigateTo: '/client/dashboard',
    position: 'bottom',
  },
  {
    target: '[data-tour="events-feed"], [data-tour="explore"]',
    title: 'Social & Events',
    description: 'Discover the most exclusive events and promote your own brand to the neighborhood.',
    navigateTo: '/explore/eventos',
    position: 'top',
  },
  {
    target: '[data-tour="ai-chat-bubble"], [data-tour="ai-concierge"]',
    title: 'The AI Concierge',
    description: 'Still have questions? Chat with me anytime to search, fix, or find anything.',
    position: 'top',
  },
];

export function useGuidedTour(steps: TourStep[] = eliteSteps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = useGuidedTourActive((s) => s.isActive);
  const setActiveGlobal = useGuidedTourActive((s) => s.setActive);
  const [currentStep, setCurrentStep] = useState(0);
  const startedRef = useRef(false);

  // Tour is opt-in only (triggered via restartTour). The previous auto-trigger
  // popped the welcome modal on every first dashboard visit and shifted layouts
  // around — disabled for a calmer experience.

  // Navigate when step requests it
  useEffect(() => {
    if (!isActive) return;
    const target = steps[currentStep]?.navigateTo;
    if (target && location.pathname !== target) {
      navigate(target);
    }
  }, [isActive, currentStep, steps, navigate, location.pathname]);

  const completeTour = useCallback(() => {
    setActiveGlobal(false);
    setCurrentStep(0);
    localStorage.setItem(TOUR_KEY, 'true');
  }, [setActiveGlobal]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < steps.length - 1) return prev + 1;
      localStorage.setItem(TOUR_KEY, 'true');
      setActiveGlobal(false);
      return 0;
    });
  }, [steps.length, setActiveGlobal]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    setCurrentStep(0);
    setActiveGlobal(true);
  }, [setActiveGlobal]);

  return {
    isActive,
    currentStep,
    totalSteps: steps.length,
    step: steps[currentStep],
    nextStep,
    prevStep,
    skipTour,
    restartTour,
    completeTour,
  };
}
