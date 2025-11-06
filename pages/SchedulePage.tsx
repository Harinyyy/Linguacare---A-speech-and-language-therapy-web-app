import React from 'react';
import { ScheduleIcon, ExternalLinkIcon } from '../components/Icons';

export const SchedulePage: React.FC = () => {
  // Placeholder URL for the scheduling service
  const schedulingUrl = 'https://calendly.com/your-therapist';

  return (
    <div className="animate-fade-in">
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Your Schedule
                </h1>
                <p className="text-slate-600 mt-1">View and manage your upcoming therapy sessions.</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 md:p-12 text-center flex flex-col items-center space-y-6">
                <div className="bg-teal-100 p-5 rounded-full">
                    <ScheduleIcon className="h-12 w-12 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Schedule Your Next Session</h2>
                <p className="text-slate-600 max-w-md">
                    We partner with Calendly to make scheduling your appointments seamless and easy. Click the button below to find a time that works for you.
                </p>
                <a 
                    href={schedulingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-teal-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-teal-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transform hover:scale-105"
                >
                    <span>Schedule Appointment</span>
                    <ExternalLinkIcon className="h-5 w-5" />
                </a>
            </div>
        </div>
    </div>
  );
};