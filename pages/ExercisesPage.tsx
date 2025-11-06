import React, { useState } from 'react';
// FIX: Updated Page type import to use the centralized types.ts file.
import type { Page, AgeGroup, Difficulty, ExerciseSettings, Language } from '../types';
import { MicIcon, ChildIcon, AdultIcon } from '../components/Icons';

const ListeningIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 5.636a9 9 0 0112.728 0M18.364 18.364A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

interface ExercisesPageProps {
  onNavigate: (page: Page, settings: ExerciseSettings) => void;
}

const languages: { id: Language; label: string }[] = [
    { id: 'english', label: 'English' },
    { id: 'tamil', label: 'தமிழ்' },
    { id: 'malayalam', label: 'മലയാളം' },
];

const ageGroups: { id: AgeGroup; label: string; icon: React.FC<{className?: string}> }[] = [
  { id: 'kids', label: 'Kids', icon: ChildIcon },
  { id: 'adults', label: 'Adults', icon: AdultIcon },
];

const difficulties: { id: Difficulty; label: string; color: string }[] = [
  { id: 'easy', label: 'Easy', color: 'bg-green-200 text-green-800' },
  { id: 'medium', label: 'Medium', color: 'bg-yellow-200 text-yellow-800' },
  { id: 'hard', label: 'Hard', color: 'bg-red-200 text-red-800' },
];

interface ExerciseCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  page: 'pronunciation_exercise' | 'listening_exercise';
  onStart: (page: Page, settings: ExerciseSettings) => void;
  colorClass: string;
  language: Language;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ title, description, icon, page, onStart, colorClass, language }) => {
    const [ageGroup, setAgeGroup] = useState<AgeGroup>('kids');
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');

    const handleStart = () => {
        onStart(page, { language, ageGroup, difficulty });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between space-y-6 transition-all transform hover:shadow-xl hover:-translate-y-1.5 border border-transparent hover:border-teal-300">
            <div className="flex items-start gap-4">
                <div className={`${colorClass} p-3 rounded-full`}>
                    {icon}
                </div>
                <div>
                    <h2 className={`font-bold text-lg text-teal-800`}>{title}</h2>
                    <p className="text-slate-600 text-sm">{description}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div role="group" aria-labelledby={`age-group-label-${page}`}>
                    <span id={`age-group-label-${page}`} className="block text-sm font-medium text-slate-700 mb-2">Age Group</span>
                    <div className="grid grid-cols-2 gap-2">
                        {ageGroups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => setAgeGroup(group.id)}
                                aria-pressed={ageGroup === group.id}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 transition-colors ${
                                    ageGroup === group.id ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                <group.icon className="h-5 w-5" aria-hidden="true" />
                                <span className="font-semibold">{group.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div role="group" aria-labelledby={`difficulty-label-${page}`}>
                    <span id={`difficulty-label-${page}`} className="block text-sm font-medium text-slate-700 mb-2">Difficulty</span>
                    <div className="grid grid-cols-3 gap-2">
                         {difficulties.map(level => (
                             <button
                                key={level.id}
                                onClick={() => setDifficulty(level.id)}
                                aria-pressed={difficulty === level.id}
                                className={`px-3 py-2 rounded-lg font-semibold text-sm transition-transform ${
                                    difficulty === level.id ? `ring-2 ring-offset-1 ring-teal-500 ${level.color} scale-105` : `${level.color.replace(/bg-(.+)-200/, 'bg-$1-100')} ${level.color.replace('bg-', 'text-')}`
                                }`}
                             >
                                 {level.label}
                             </button>
                         ))}
                    </div>
                </div>
            </div>

            <button 
                onClick={handleStart}
                className={`${colorClass} text-white font-bold py-3 px-6 rounded-lg w-full hover:opacity-90 transition-opacity`}
            >
                Start Practice
            </button>
        </div>
    );
};


export const ExercisesPage: React.FC<ExercisesPageProps> = ({ onNavigate }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  return (
    <div className="animate-fade-in">
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    {selectedLanguage ? 'Select an Exercise' : 'Choose Your Practice'}
                </h1>
                <p className="text-slate-600 mt-1">
                    {selectedLanguage
                        ? 'Now, choose an activity and set your level to begin.'
                        : 'Select a language to begin your session.'}
                </p>
            </div>
            
            {!selectedLanguage ? (
                // Language Selection View
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-fade-in">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">
                        Choose a Language
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {languages.map(lang => (
                            <button
                                key={lang.id}
                                onClick={() => setSelectedLanguage(lang.id)}
                                className="px-4 py-8 rounded-lg font-semibold text-2xl transition-all border-2 flex items-center justify-center transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 bg-slate-50 border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 hover:scale-105"
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                // Exercise Selection View
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md border border-slate-200">
                        <p className="font-medium text-slate-700">
                            Selected Language: <span className="font-bold text-teal-600">{languages.find(l => l.id === selectedLanguage)?.label}</span>
                        </p>
                        <button 
                            onClick={() => setSelectedLanguage(null)}
                            className="text-sm font-semibold text-teal-600 hover:underline transition-colors"
                        >
                            Change Language
                        </button>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Select an Exercise
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <ExerciseCard 
                            title="Pronunciation Practice"
                            description="Practice saying phrases and get instant feedback."
                            icon={<MicIcon />}
                            page="pronunciation_exercise"
                            onStart={onNavigate}
                            colorClass="bg-teal-600"
                            language={selectedLanguage}
                       />
                       <ExerciseCard 
                            title="Listening Skills"
                            description="Listen to a phrase and select the correct words."
                            icon={<ListeningIcon />}
                            page="listening_exercise"
                            onStart={onNavigate}
                            colorClass="bg-teal-600"
                            language={selectedLanguage}
                       />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};