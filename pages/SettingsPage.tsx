import React, { useState, useEffect } from 'react';
import type { User, UserFeedback } from '../types';
import { UserCircleIcon, SpeakerIcon, ChatBubbleIcon, SendIcon } from '../components/Icons';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface SettingsPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

// A simple toggle switch component for preferences
const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; label: string }> = ({ enabled, onChange, label }) => {
    const id = label.replace(/\s+/g, '-').toLowerCase();
    return (
        <label htmlFor={id} className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-700">{label}</span>
            <div className="relative">
                <input id={id} type="checkbox" className="sr-only" checked={enabled} onChange={() => onChange(!enabled)} />
                <div className={`block w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-teal-500' : 'bg-slate-200'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
            </div>
        </label>
    );
};

const VoiceSelector: React.FC<{
    langCode: 'en-US' | 'ta-IN' | 'ml-IN';
    label: string;
    voices: SpeechSynthesisVoice[];
    selectedValue: string;
    onChange: (langCode: 'en-US' | 'ta-IN' | 'ml-IN', voiceName: string) => void;
}> = ({ langCode, label, voices, selectedValue, onChange }) => {
    return (
        <div>
            <label htmlFor={`voice-${langCode}`} className="block text-sm font-medium text-slate-700">
                {label} Voice
            </label>
            <select
                id={`voice-${langCode}`}
                value={selectedValue}
                onChange={(e) => onChange(langCode, e.target.value)}
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
                <option value="">Browser Default</option>
                {voices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                    </option>
                ))}
            </select>
            {voices.length === 0 && <p className="text-xs text-slate-500 mt-1">No specific {label} voices found in this browser.</p>}
        </div>
    );
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const { voicesLoading, availableVoices } = useTextToSpeech();
    
    const [preferredVoices, setPreferredVoices] = useState({
        'en-US': '',
        'ta-IN': '',
        'ml-IN': '',
    });

    const [feedbackType, setFeedbackType] = useState<UserFeedback['type']>('suggestion');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    useEffect(() => {
        try {
            const en = localStorage.getItem('linguacare_tts_voice_en-US') || '';
            const ta = localStorage.getItem('linguacare_tts_voice_ta-IN') || '';
            const ml = localStorage.getItem('linguacare_tts_voice_ml-IN') || '';
            setPreferredVoices({ 'en-US': en, 'ta-IN': ta, 'ml-IN': ml });
        } catch (e) {
            console.error("Failed to load TTS preferences from localStorage", e);
        }
    }, []);

    const handleVoiceChange = (langCode: 'en-US' | 'ta-IN' | 'ml-IN', voiceName: string) => {
        try {
            if (voiceName) {
                localStorage.setItem(`linguacare_tts_voice_${langCode}`, voiceName);
            } else {
                localStorage.removeItem(`linguacare_tts_voice_${langCode}`);
            }
            setPreferredVoices(prev => ({ ...prev, [langCode]: voiceName }));
        } catch (e) {
             console.error("Failed to save TTS preference to localStorage", e);
        }
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        setSaveStatus('saving');

        const updatedUser: User = { ...user, name: name.trim() || user.name };
        onUpdateUser(updatedUser);

        console.log('Preferences saved:', { notificationsEnabled });
        
        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
        }, 700);
    };

    const handleFeedbackSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (feedbackMessage.trim() === '') return;
        setFeedbackStatus('sending');

        const newFeedback: UserFeedback = {
            id: crypto.randomUUID(),
            userEmail: user.email,
            userName: user.name,
            type: feedbackType,
            message: feedbackMessage.trim(),
            date: new Date().toISOString(),
            status: 'new',
        };
        
        try {
            const FEEDBACK_KEY = 'linguacare_user_feedback';
            const existingFeedbackJson = localStorage.getItem(FEEDBACK_KEY);
            const existingFeedback: UserFeedback[] = existingFeedbackJson ? JSON.parse(existingFeedbackJson) : [];
            const updatedFeedback = [newFeedback, ...existingFeedback];
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updatedFeedback));
        } catch (error) {
            console.error("Failed to save feedback to localStorage", error);
        }

        setTimeout(() => {
            setFeedbackStatus('sent');
            setFeedbackMessage('');
            setFeedbackType('suggestion');
            setTimeout(() => setFeedbackStatus('idle'), 3000);
        }, 500);
    };

  return (
    <div className="animate-fade-in">
        <div className="w-full max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Settings
                </h1>
                <p className="text-slate-600 mt-1">Manage your account and application preferences.</p>
            </div>
            
            <form onSubmit={handleSaveChanges}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                    <div className="p-6 space-y-6">
                        {/* Profile Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                                <UserCircleIcon className="w-6 h-6 text-slate-500" />
                                <span>Profile Information</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                                    <input 
                                        type="text" 
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                                    <input 
                                        type="email" 
                                        id="email"
                                        value={user.email}
                                        disabled
                                        className="mt-1 block w-full px-4 py-2.5 border border-slate-200 rounded-lg shadow-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-200" />

                        {/* Preferences Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-slate-700">Application Preferences</h2>
                            <div className="p-4 bg-slate-50 rounded-lg">
                               <ToggleSwitch
                                    label="Enable Email Notifications"
                                    enabled={notificationsEnabled}
                                    onChange={setNotificationsEnabled}
                                />
                                <p className="text-xs text-slate-500 mt-2">Receive updates about your progress and upcoming sessions.</p>
                            </div>
                        </div>
                        
                        <hr className="border-slate-200" />

                        {/* TTS Preferences Section */}
                        <div className="space-y-4">
                             <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                                <SpeakerIcon className="w-6 h-6 text-slate-500" />
                                <span>Text-to-Speech Preferences</span>
                            </h2>
                             {voicesLoading ? (
                                <p className="text-slate-500 text-sm px-1">Loading available voices...</p>
                            ) : (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                                    <VoiceSelector 
                                        langCode="en-US"
                                        label="English"
                                        voices={availableVoices.english}
                                        selectedValue={preferredVoices['en-US']}
                                        onChange={handleVoiceChange}
                                    />
                                    <VoiceSelector 
                                        langCode="ta-IN"
                                        label="Tamil"
                                        voices={availableVoices.tamil}
                                        selectedValue={preferredVoices['ta-IN']}
                                        onChange={handleVoiceChange}
                                    />
                                    <VoiceSelector 
                                        langCode="ml-IN"
                                        label="Malayalam"
                                        voices={availableVoices.malayalam}
                                        selectedValue={preferredVoices['ml-IN']}
                                        onChange={handleVoiceChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-4">
                        {saveStatus === 'saved' && (
                            <span className="text-green-600 font-medium text-sm animate-fade-in">
                                Changes saved successfully!
                            </span>
                        )}
                        <button
                            type="submit"
                            disabled={saveStatus === 'saving'}
                            className="bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-teal-400 disabled:cursor-wait"
                        >
                            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
            
            {user.role === 'user' && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
                    <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                            <ChatBubbleIcon className="w-6 h-6 text-slate-500" />
                            <span>Submit Feedback</span>
                        </h2>
                        <p className="text-sm text-slate-500">
                            Have a suggestion or found a bug? Let us know!
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Feedback Type</label>
                            <div className="flex gap-4">
                                {(['suggestion', 'bug', 'other'] as const).map(type => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="feedbackType"
                                            value={type}
                                            checked={feedbackType === type}
                                            onChange={() => setFeedbackType(type)}
                                            className="h-4 w-4 border-slate-300 text-teal-600 focus:ring-teal-500"
                                        />
                                        <span className="text-slate-700 capitalize">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="feedback-message" className="block text-sm font-medium text-slate-700">Message</label>
                            <textarea
                                id="feedback-message"
                                value={feedbackMessage}
                                onChange={(e) => setFeedbackMessage(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="Please provide as much detail as possible..."
                                required
                            />
                        </div>

                        <div className="flex justify-end items-center gap-4">
                             {feedbackStatus === 'sent' && (
                                <span className="text-green-600 font-medium text-sm animate-fade-in">
                                    Thank you for your feedback!
                                </span>
                            )}
                            <button 
                                type="submit"
                                disabled={feedbackStatus === 'sending' || feedbackMessage.trim() === ''}
                                className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-teal-400 disabled:cursor-not-allowed"
                            >
                                <SendIcon className="h-5 w-5"/>
                                <span>{feedbackStatus === 'sending' ? 'Sending...' : 'Submit Feedback'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    </div>
  );
};