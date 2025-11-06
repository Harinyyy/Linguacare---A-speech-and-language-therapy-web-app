import React, { useState } from 'react';
import { LogoIcon, ExercisesIcon, MicIcon, ChatBubbleIcon, XIcon } from './Icons';

interface OnboardingTourProps {
  onComplete: () => void;
}

const tourSteps = [
  {
    icon: LogoIcon,
    title: 'Welcome to Linguacare!',
    text: 'This quick tour will guide you through the key features to help you get started on your speech therapy journey.',
  },
  {
    icon: ExercisesIcon,
    title: 'Choose Your Practice',
    text: "Head to the 'Exercises' page from the sidebar. Here, you can select your language, age group, and difficulty to find the perfect practice session for you.",
  },
  {
    icon: MicIcon,
    title: 'Get Instant Feedback',
    text: 'In Pronunciation Practice, just tap the microphone, say the phrase, and our AI will provide instant, detailed feedback on your speech to help you improve.',
  },
  {
    icon: ChatBubbleIcon,
    title: 'Your Navigation Assistant',
    text: "Need help getting around? Use our friendly chatbot in the bottom-right corner. Just tell it where you want to go!",
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tourSteps[currentStep];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center space-y-6 relative transform transition-all animate-modal-pop-in">
        <button
          onClick={onComplete}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Skip tour"
        >
          <XIcon className="h-6 w-6" />
        </button>

        <div className="flex justify-center text-teal-500">
          <step.icon className="w-16 h-16" />
        </div>

        <div className="space-y-2">
          <h2 id="onboarding-title" className="text-2xl font-bold text-slate-800">
            {step.title}
          </h2>
          <p className="text-slate-600">
            {step.text}
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: tourSteps.length }).map((_, index) => (
                <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        index === currentStep ? 'bg-teal-500' : 'bg-slate-300'
                    }`}
                />
            ))}
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="bg-slate-200 text-slate-700 font-semibold py-2.5 px-6 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Back
            </button>
          ) : (
             <div className="w-24" /> // Placeholder for alignment
          )}
          
          <button
            onClick={handleNext}
            className="bg-teal-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex-1"
          >
            {currentStep === tourSteps.length - 1 ? "Let's Get Started!" : 'Next'}
          </button>
        </div>
      </div>
      <style>{`
          @keyframes popIn { 
              from { opacity: 0; transform: scale(0.95) translateY(10px); } 
              to { opacity: 1; transform: scale(1) translateY(0); } 
          }
          .animate-modal-pop-in { animation: popIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};
