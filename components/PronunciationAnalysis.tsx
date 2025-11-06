import React, { useState, useEffect } from 'react';
import type { DetailedPhraseAnalysis, Language } from '../types';
import { getDetailedPronunciationAnalysis } from '../services/geminiService';
import { XIcon, LightbulbIcon, AcademicCapIcon, ChatAltIcon } from './Icons';

interface PronunciationAnalysisProps {
  phrase: string;
  language: Language;
  onClose: () => void;
}

export const PronunciationAnalysis: React.FC<PronunciationAnalysisProps> = ({ phrase, language, onClose }) => {
  const [analysis, setAnalysis] = useState<DetailedPhraseAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getDetailedPronunciationAnalysis(phrase, language);
        setAnalysis(result);
      } catch (err) {
        console.error("Error fetching pronunciation analysis:", err);
        setError("Sorry, I couldn't get pronunciation tips right now. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [phrase, language]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-teal-500 border-dashed rounded-full animate-spin border-t-transparent"></div>
          <span className="ml-2 text-slate-600">Getting tips...</span>
        </div>
      );
    }

    if (error) {
      return <p className="text-red-600 text-sm">{error}</p>;
    }

    if (!analysis) {
      return null;
    }

    return (
      <div className="space-y-4 text-left">
        {analysis.overallPronunciationGuide && (
             <div className="p-3 bg-teal-50 border-l-4 border-teal-400 rounded-r-lg">
                <h4 className="font-semibold text-teal-800 text-sm mb-1 flex items-center gap-1.5">
                    <ChatAltIcon className="w-5 h-5" />
                    <span>Overall Guide</span>
                </h4>
                <p className="text-teal-900 font-mono bg-teal-100 px-2 py-1 rounded text-sm inline-block">
                    {analysis.overallPronunciationGuide}
                </p>
            </div>
        )}
       
        {analysis.challengingWords && analysis.challengingWords.length > 0 && (
            <div>
                <h4 className="font-semibold text-slate-700 text-sm mb-2">Challenging Words:</h4>
                 <div className="space-y-3">
                    {analysis.challengingWords.map((word, index) => (
                        <div key={index} className="bg-white border border-slate-200 p-3 rounded-lg">
                            <h5 className="font-bold text-slate-800">{word.word}</h5>
                            <div className="text-sm text-slate-600 space-y-2 mt-1">
                                <p><strong className="font-medium">Syllables:</strong> {word.syllables}</p>
                                <p><strong className="font-medium">Sounds like:</strong> <span className="font-mono bg-slate-100 px-1 rounded">{word.phoneticGuide}</span></p>
                                
                                {word.commonMistakes?.length > 0 && (
                                    <div className="pt-2">
                                        <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                                           <AcademicCapIcon className="w-5 h-5 text-slate-500" />
                                           Common Mistakes
                                        </p>
                                        <ul className="list-disc list-inside pl-2 mt-1 space-y-0.5 text-slate-600">
                                            {word.commonMistakes.map((mistake, i) => <li key={i}>{mistake}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {word.practiceTip && (
                                    <div className="pt-2">
                                        <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                                           <LightbulbIcon className="w-5 h-5 text-yellow-500" />
                                           Practice Tip
                                        </p>
                                        <p className="text-slate-600 mt-1">{word.practiceTip}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl border animate-fade-in relative text-sm">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
        aria-label="Close pronunciation tips"
      >
        <XIcon className="h-5 w-5" />
      </button>
      <h3 className="text-base font-bold text-slate-800 mb-3 text-center">Pronunciation Breakdown</h3>
      {renderContent()}
    </div>
  );
};