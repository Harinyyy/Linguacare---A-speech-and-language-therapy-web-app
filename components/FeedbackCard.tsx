import React, { useState, useRef, useEffect } from 'react';
import type { Language, PronunciationFeedback } from '../types';
import { CheckCircleIcon, PlayIcon, XCircleIcon, PauseIcon, SpeakerIcon, ChevronDownIcon } from './Icons';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface FeedbackCardProps {
  feedback: PronunciationFeedback;
  audioUrl: string | null;
  onNextPhrase: () => void;
  language: Language;
}

const ScoreDonut: React.FC<{ score: number }> = ({ score }) => {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (score / 100) * circumference;

    let colorClass = 'stroke-green-500';
    if (score < 75) colorClass = 'stroke-yellow-500';
    if (score < 50) colorClass = 'stroke-red-500';

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="text-slate-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
                <circle
                    className={`${colorClass} transition-all duration-1000 ease-in-out`}
                    strokeWidth="10"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset, transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-700">{score}</span>
            </div>
        </div>
    );
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, audioUrl, onNextPhrase, language }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { isSpeaking, speak } = useTextToSpeech();

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onPause);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onPause);
    };
  }, [audioUrl]);


  return (
    <div className="p-6 bg-slate-50 rounded-xl space-y-6 animate-fade-in border border-slate-200">
        <h3 className="text-xl font-bold text-center text-slate-800">Your Feedback</h3>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
                <ScoreDonut score={feedback.overallScore} />
            </div>
            <div className="flex-1 text-center md:text-left">
                <p className="font-semibold text-slate-700">Summary:</p>
                <p className="text-slate-600">{feedback.summary}</p>
                {audioUrl && (
                    <div className="mt-4">
                        <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />
                        <button
                            onClick={handlePlayPause}
                            className="inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                            aria-label={isPlaying ? "Pause your recording" : "Play your recording"}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                            <span>{isPlaying ? 'Pause' : 'Play Your Recording'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>

        <div>
            <h4 className="font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">Word-by-Word Analysis:</h4>
            <div className="space-y-2">
                {feedback.wordAnalysis.map((word, index) => {
                    if (word.isCorrect) {
                        return (
                             <div key={index} className="flex items-center justify-between gap-2 p-3 bg-green-50 text-green-800 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon />
                                    <span className="font-medium">{word.word}</span>
                                </div>
                                <button
                                    onClick={() => speak(word.word, language)}
                                    disabled={isSpeaking}
                                    className="p-1.5 text-teal-600 hover:text-teal-800 disabled:text-slate-400 disabled:cursor-not-allowed rounded-full hover:bg-green-100 transition-colors"
                                    aria-label={`Listen to the word ${word.word}`}
                                >
                                    <SpeakerIcon className="h-5 w-5" />
                                </button>
                            </div>
                        );
                    } else {
                        const isExpanded = expandedIndex === index;
                        return (
                            <div key={index} className="bg-red-50 rounded-lg border border-red-200">
                                <button
                                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                className="w-full flex items-center justify-between p-3 rounded-lg text-left text-red-800 hover:bg-red-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                                aria-expanded={isExpanded}
                                aria-controls={`word-details-${index}`}
                                >
                                <div className="flex items-center gap-2">
                                    <XCircleIcon />
                                    <span className="font-medium">{word.word}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                    onClick={(e) => { e.stopPropagation(); speak(word.word, language); }}
                                    disabled={isSpeaking}
                                    className="p-1.5 text-teal-600 hover:text-teal-800 disabled:text-slate-400 disabled:cursor-not-allowed rounded-full hover:bg-red-100 transition-colors cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Listen to the word ${word.word}`}
                                    >
                                    <SpeakerIcon className="h-5 w-5" />
                                    </span>
                                    <ChevronDownIcon className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                                </button>

                                {isExpanded && (
                                    <div 
                                        id={`word-details-${index}`}
                                        role="region"
                                        className="p-3 mt-1 bg-white rounded-b-lg border-t border-red-200 space-y-4 animate-fade-in text-sm">
                                        {word.userPronunciationError && (
                                            <div>
                                                <strong className="font-semibold text-slate-800">What We Heard:</strong>
                                                <p className="text-slate-600 italic">"{word.userPronunciationError}"</p>
                                            </div>
                                        )}
                                        {word.tip && (
                                            <div>
                                                <strong className="font-semibold text-slate-800">Tip:</strong>
                                                <p className="text-slate-700">{word.tip}</p>
                                            </div>
                                        )}
                                        {word.pronunciationGuide && (
                                            <div>
                                              <strong className="font-semibold text-slate-800">Pronunciation:</strong>
                                              <p className="text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded inline-block mt-1">{word.pronunciationGuide}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }
                })}
            </div>
        </div>
        
        <div className="text-center border-t border-slate-200 pt-6">
            <button 
                onClick={onNextPhrase}
                className="bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
                Try Another Phrase
            </button>
        </div>
    </div>
  );
};