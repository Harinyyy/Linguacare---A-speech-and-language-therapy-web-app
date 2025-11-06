import React, { useState, useEffect, useMemo } from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { SpeakerIcon, CheckCircleIcon, XCircleIcon, XIcon, PauseIcon } from '../components/Icons';
import { phrases } from '../data/phrases';
import type { ExerciseSettings, User } from '../types';
import { Stopwatch } from '../components/Stopwatch';

const DISTRACTOR_WORDS = ["apple", "house", "runs", "under", "pretty", "yellow", "quickly", "very", "the", "a", "is", "on"];

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

interface ListeningExercisePageProps {
  settings: ExerciseSettings;
  user: User;
  startTime: number | null;
  isFrozen: boolean;
}

export const ListeningExercisePage: React.FC<ListeningExercisePageProps> = ({ settings, user, startTime, isFrozen }) => {
    const practicePhrases = useMemo(
        () => phrases[settings.language][settings.ageGroup][settings.difficulty],
        [settings]
    );

    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [wordOptions, setWordOptions] = useState<string[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    
    const { isSpeaking, speak } = useTextToSpeech();
    
    const currentPhrase = useMemo(() => practicePhrases[currentPhraseIndex], [currentPhraseIndex, practicePhrases]);
    const correctWords = useMemo(() => currentPhrase.replace(/[.,?]/g, '').split(' '), [currentPhrase]);

    useEffect(() => {
        const phraseWords = correctWords;
        
        const distractors = shuffleArray(DISTRACTOR_WORDS)
            .filter(word => !phraseWords.map(w => w.toLowerCase()).includes(word))
            .slice(0, 4);
            
        setWordOptions(shuffleArray([...phraseWords, ...distractors]));
        setSelectedWords([]);
        setShowFeedback(false);
        setIsCorrect(false);

        // Speak the new phrase automatically after a short delay to allow UI to settle.
        // This enhances the "listening" part of the exercise.
        const speakTimeout = setTimeout(() => {
            // Only speak if the exercise isn't paused for a break.
            if (!isFrozen) {
                speak(currentPhrase, settings.language);
            }
        }, 500); // 500ms delay for a smoother user experience.

        // Cleanup timeout on re-render or unmount.
        return () => clearTimeout(speakTimeout);

    }, [correctWords, currentPhrase, settings.language, speak, isFrozen]);

    const handleWordSelect = (word: string) => {
        if (showFeedback) return;
        setSelectedWords(prev => [...prev, word]);
    };

    const handleWordDeselect = (indexToRemove: number) => {
        if (showFeedback) return;
        setSelectedWords(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleCheckAnswer = () => {
        const userAnswer = selectedWords.join(' ');
        const correctAnswer = correctWords.join(' ');
        
        const correct = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
        setIsCorrect(correct);
        setShowFeedback(true);
    };
    
    const handleNextPhrase = () => {
        setCurrentPhraseIndex(prev => (prev + 1) % practicePhrases.length);
    };

    const handleRetry = () => {
        setSelectedWords([]);
        setShowFeedback(false);
        setIsCorrect(false);
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 animate-fade-in border border-slate-200">
             {isFrozen && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl text-white p-4 text-center">
                    <PauseIcon className="h-12 w-12 mb-4 text-slate-300" />
                    <h3 className="text-2xl font-bold">Break in Progress</h3>
                    <p className="text-lg mt-1 opacity-90">Your exercise will resume shortly.</p>
                </div>
            )}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-800 text-center">Listening Skills</h1>
                 {startTime && <Stopwatch startTime={startTime} />}
            </div>

            <div className="text-center space-y-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-600">Listen to the phrase, then reconstruct it using the words below.</p>
                <button
                    onClick={() => speak(currentPhrase, settings.language)}
                    disabled={isSpeaking}
                    className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-teal-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                    <SpeakerIcon />
                    {isSpeaking ? 'Speaking...' : 'Listen to Phrase'}
                </button>
            </div>
            
            <div className="min-h-[6rem] bg-slate-100 rounded-lg p-3 flex flex-wrap gap-2 items-start border-2 border-dashed border-slate-300">
                {selectedWords.length === 0 && <p className="text-slate-400 p-2">Your constructed sentence will appear here...</p>}
                {selectedWords.map((word, index) => (
                    <button 
                        key={`${word}-${index}`}
                        onClick={() => handleWordDeselect(index)}
                        className="flex items-center gap-1.5 bg-white text-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                        aria-label={`Remove ${word}`}
                    >
                        {word}
                        <XIcon className="h-4 w-4 text-slate-500" />
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                {wordOptions.map((word, index) => (
                    <button
                        key={`${word}-${index}`}
                        onClick={() => handleWordSelect(word)}
                        disabled={showFeedback}
                        className="bg-teal-100 text-teal-800 font-medium px-4 py-2 rounded-lg hover:bg-teal-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        {word}
                    </button>
                ))}
            </div>
            
            <div className="pt-4 border-t border-slate-200 text-center space-y-4">
                {!showFeedback ? (
                    <button
                        onClick={handleCheckAnswer}
                        disabled={selectedWords.length === 0}
                        className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Check Answer
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg text-lg font-semibold ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isCorrect ? <CheckCircleIcon /> : <XCircleIcon />}
                            <span>{isCorrect ? 'Correct! Well done.' : 'Not quite, keep practicing!'}</span>
                        </div>
                        {!isCorrect && (
                             <div className="text-left bg-slate-100 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-700">Correct answer:</p>
                                    <p className="text-slate-600">{correctWords.join(' ')}</p>
                                </div>
                                <button
                                    onClick={() => speak(correctWords.join(' '), settings.language)}
                                    disabled={isSpeaking}
                                    className="p-2 rounded-full text-slate-600 hover:bg-slate-200 hover:text-teal-600 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
                                    aria-label="Listen to correct answer"
                                >
                                    <SpeakerIcon />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-4">
                            {!isCorrect && (
                                <button 
                                    onClick={handleRetry}
                                    className="bg-slate-200 text-slate-800 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                                >
                                    Try Again
                                </button>
                            )}
                            <button 
                                onClick={handleNextPhrase}
                                className="bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                            >
                                {isCorrect ? 'Next Phrase' : 'Continue'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};