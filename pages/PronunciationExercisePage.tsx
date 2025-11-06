import React, { useState, useCallback, useEffect } from 'react';
import { PronunciationPractice } from '../components/PronunciationPractice';
import { FeedbackCard } from '../components/FeedbackCard';
import { Loader } from '../components/Loader';
import { analyzePronunciation } from '../services/geminiService';
import type { PronunciationFeedback, ExerciseResult, ExerciseSettings, User } from '../types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { phrases } from '../data/phrases';
import { Stopwatch } from '../components/Stopwatch';
import { PauseIcon } from '../components/Icons';

interface PronunciationExercisePageProps {
  settings: ExerciseSettings;
  user: User;
  startTime: number | null;
  isFrozen: boolean;
}

export const PronunciationExercisePage: React.FC<PronunciationExercisePageProps> = ({ settings, user, startTime, isFrozen }) => {
  const practicePhrases = phrases[settings.language][settings.ageGroup][settings.difficulty];
  
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isRecording, audioBlob, audioUrl, startRecording, stopRecording, volume, recorderError } = useAudioRecorder();
  const { isSpeaking: isBotSpeaking, speak } = useTextToSpeech();
  
  const currentPhrase = practicePhrases[currentPhraseIndex];

  useEffect(() => {
    if (recorderError) {
      setError(recorderError);
    }
  }, [recorderError]);
  
  const handleGetFeedback = useCallback(async () => {
    if (!audioBlob) {
      setError("No audio recorded. Please try recording again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await analyzePronunciation(currentPhrase, audioBlob, settings.language);
      setFeedback(result);

      try {
        const HISTORY_KEY = 'linguacare_exercise_history';
        const MAX_HISTORY_ITEMS = 50;

        const historyJson = localStorage.getItem(HISTORY_KEY);
        const history: ExerciseResult[] = historyJson ? JSON.parse(historyJson) : [];

        const newResult: ExerciseResult = {
          id: crypto.randomUUID(),
          phrase: currentPhrase,
          score: result.overallScore,
          date: new Date().toISOString(),
          feedback: result,
          userEmail: user.email,
          status: 'pending', // Add status for admin review
        };

        const updatedHistory = [newResult, ...history].slice(0, MAX_HISTORY_ITEMS);
        
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to save exercise result to localStorage", e);
      }

    } catch (err) {
      console.error("Error getting feedback:", err);
      setError("Sorry, I couldn't analyze your speech. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [audioBlob, currentPhrase, user.email, settings.language]);
  
  useEffect(() => {
    if(audioBlob) {
        handleGetFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const handleNextPhrase = () => {
    setFeedback(null);
    setError(null);
    setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % practicePhrases.length);
  };
  
  const handleStartRecording = () => {
    setError(null);
    startRecording();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
       {isFrozen && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl text-white p-4 text-center">
            <PauseIcon className="h-12 w-12 mb-4 text-slate-300" />
            <h3 className="text-2xl font-bold">Break in Progress</h3>
            <p className="text-lg mt-1 opacity-90">Your exercise will resume shortly.</p>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 animate-fade-in border border-slate-200">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <h1 className="text-xl font-bold text-slate-800">Pronunciation Practice</h1>
            {startTime && <Stopwatch startTime={startTime} />}
        </div>
      
        <PronunciationPractice
            phrase={currentPhrase}
            language={settings.language}
            isRecording={isRecording}
            isBotSpeaking={isBotSpeaking}
            volume={volume}
            onStartRecording={handleStartRecording}
            onStopRecording={stopRecording}
            onListen={() => speak(currentPhrase, settings.language)}
        />
        {error && <div className="text-red-600 bg-red-100 p-3 rounded-lg text-center">{error}</div>}
        {isLoading && <Loader />}
        {feedback && !isLoading && (
            <div className="border-t border-slate-200 pt-6">
                <FeedbackCard 
                    feedback={feedback} 
                    audioUrl={audioUrl}
                    onNextPhrase={handleNextPhrase}
                    language={settings.language}
                />
            </div>
        )}
      </div>
       <footer className="text-center text-sm text-slate-500 pt-8">
          <p>&copy; {new Date().getFullYear()} Linguacare. All rights reserved.</p>
      </footer>
    </div>
  );
};