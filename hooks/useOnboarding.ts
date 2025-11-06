import { useState, useCallback, useEffect } from 'react';

const ONBOARDING_KEY = 'linguacare_onboarding_completed';

export const useOnboarding = () => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
      if (!hasCompleted) {
        setShowTour(true);
      }
    } catch (error) {
      console.error("Failed to read onboarding status from localStorage", error);
      // Fail safe: don't show the tour if localStorage is inaccessible
      setShowTour(false);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setShowTour(false);
    } catch (error) {
      console.error("Failed to save onboarding status to localStorage", error);
       // Still hide the tour for the current session even if saving fails
      setShowTour(false);
    }
  }, []);

  return { showTour, completeOnboarding };
};
