import React, { useState } from 'react';
import { MicIcon, StopCircleIcon, SpeakerIcon } from './Icons';
import { PronunciationAnalysis } from './PronunciationAnalysis';
import type { Language } from '../types';

interface PronunciationPracticeProps {
  phrase: string;
  language: Language;
  isRecording: boolean;
  isBotSpeaking: boolean;
  volume: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onListen: () => void;
}

export const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({
  phrase,
  language,
  isRecording,
  isBotSpeaking,
  volume,
  onStartRecording,
  onStopRecording,
  onListen,
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);

  return (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-lg font-medium text-slate-600">
          Please say the following phrase:
        </h2>
        <div className="relative mt-2">
            <p className="text-2xl md:text-3xl font-semibold text-teal-700 p-4 pr-12 bg-teal-50 rounded-lg">
                "{phrase}"
            </p>
             <button
                onClick={onListen}
                disabled={isRecording || isBotSpeaking}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-500 hover:text-teal-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Listen to phrase"
            >
                <SpeakerIcon />
            </button>
        </div>

        <div className="mt-4">
          {!showAnalysis ? (
            <button
              onClick={() => setShowAnalysis(true)}
              disabled={isRecording || isBotSpeaking}
              className="text-sm font-semibold text-teal-600 hover:text-teal-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              aria-label="Get pronunciation tips for this phrase"
            >
              Need help? Get pronunciation tips.
            </button>
          ) : (
            <PronunciationAnalysis
              phrase={phrase}
              language={language}
              onClose={() => setShowAnalysis(false)}
            />
          )}
        </div>
      </div>

      {/* Recording Controls Section */}
      <div className="flex flex-col items-center space-y-3">
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isBotSpeaking}
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed
            ${isRecording
              ? 'bg-red-500 text-white shadow-lg animate-pulse focus:ring-red-300'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md focus:ring-teal-400'
            }`}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? <StopCircleIcon /> : <MicIcon />}
        </button>
        
        {/* Volume Visualizer */}
        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden" aria-hidden="true">
            <div 
                className="bg-teal-500 h-full rounded-full transition-all duration-75 ease-out"
                style={{ width: `${isRecording ? volume * 100 : 0}%` }}
            ></div>
        </div>
      
        <p className="text-sm text-slate-500">
          {isRecording ? 'Recording in progress...' : isBotSpeaking ? 'Listen to the example...' : 'Tap the microphone to start'}
        </p>
      </div>
    </div>
  );
};