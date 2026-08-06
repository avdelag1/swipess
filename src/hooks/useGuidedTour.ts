import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGuidedTourActive } from '@/state/guidedTourStore';

const TOUR_KEY = 'guidedTourCompleted';

export interface TourStep {
  target: string; // CSS selector â€” use 'body' for centered welcome
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  navigateTo?: string; // optional path to navigate before showing
  welcome?: boolean; // if true, render as centered modal (no spotlight)
}

const eliteSteps: TourStep[] = [
  {
    target: 'body',
    title: 'Welcome to Swipess',
    description: 'Right here you will be able to find properties, yachts, motorcycles, bicycles, and workers. You can also promote your job or work by posting your own listings.',
    welcome: true,
  },
  {
    target: 'body',
    title: 'The Power of AI',
    description: 'Use the AI to effortlessly create your profile or upload listings. You can also generate legal contracts and talk directly to our AI legal advisors.',
    welcome: true,
  },
  {
    target: 'body',
    title: 'Trust & Local Identity',
    description: 'Get the benefit of a Virtual ID Card. This helps identify you as a trusted local person within the community ecosystem.',
    welcome: true,
  },
  {
    target: 'body',
    title: 'Events & Opportunities',
    description: 'Promote your local events, and remember—you can also make money by posting jobs and connecting with workers.',
    welcome: true,
  },
  {
    target: 'body',
    title: 'A Real Tool for the Community',
    description: 'This isn\'t something we just want to sell. This is a real tool built to help the community. This is a place where everybody must respect each other, help each other, and connect in the best way possible.',
    welcome: true,
  },
];

export function useGuidedTour(steps: TourStep[] = eliteSteps, isAuthenticated = false) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = useGuidedTourActive((s) => s.isActive);
  const setActiveGlobal = useGuidedTourActive((s) => s.setActive);
  const [currentStep, setCurrentStep] = useState(0);
  const _startedRef = useRef(false);

  // Auto-start tour only after the user has authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!_startedRef.current) {
      _startedRef.current = true;
      const completed = localStorage.getItem(TOUR_KEY) === 'true';
      if (!completed) {
        // slight delay to let app breathe before popping tutorial
        setTimeout(() => setActiveGlobal(true), 1000);
      }
    }
  }, [setActiveGlobal, isAuthenticated]);

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
