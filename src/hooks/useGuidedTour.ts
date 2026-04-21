import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const TOUR_KEY = 'guidedTourCompleted';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const defaultSteps: TourStep[] = [
  {
    target: '[data-tour="swipe-area"]',
    title: 'Swipe to Discover',
    description: 'Swipe right to like, left to pass. Find your perfect match!',
    position: 'bottom',
  },
  {
    target: '[data-tour="filters"]',
    title: 'Set Your Filters',
    description: 'Customize what you see — price, location, amenities & more.',
    position: 'bottom',
  },
  {
    target: '[data-tour="messages"]',
    title: 'Messages',
    description: 'Chat with matches and owners directly in the app.',
    position: 'top',
  },
  {
    target: '[data-tour="explore"]',
    title: 'Explore More',
    description: 'Discover neighborhoods, price trends, and local intel.',
    position: 'top',
  },
  {
    target: '[data-tour="settings"]',
    title: 'Your Settings',
    description: 'Manage your profile, security, and preferences.',
    position: 'top',
  },
];

export function useGuidedTour(steps: TourStep[] = defaultSteps) {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const canRunTour = useMemo(() => {
    return location.pathname === '/client/dashboard' || location.pathname === '/owner/dashboard';
  }, [location.pathname]);

  useEffect(() => {
    if (!canRunTour) {
      setIsActive(false);
      setCurrentStep(0);
      return;
    }

    // Auto-trigger on first visit after onboarding
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [canRunTour]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  }, [currentStep]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(TOUR_KEY, 'true');
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    isActive: canRunTour && isActive,
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


