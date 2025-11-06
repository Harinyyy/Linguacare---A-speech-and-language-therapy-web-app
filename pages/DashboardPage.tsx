import React, { useState, useEffect } from 'react';
import type { Page, User, ExerciseResult, AdminFeedback } from '../types';
import { ExercisesIcon, ChevronDownIcon, CheckCircleIcon, XCircleIcon, InfoCircleIcon, XIcon } from '../components/Icons';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface DashboardPageProps {
  user: User;
  onNavigate: (page: Page) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onNavigate }) => {
  const [history, setHistory] = useState<ExerciseResult[]>([]);
  const [adminFeedback, setAdminFeedback] = useState<AdminFeedback[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ExerciseResult[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const { playNotification } = useSoundEffects();

  // State for filters
  const [phraseFilter, setPhraseFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all'); // 'all', 'good', 'okay', 'bad'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '7days', '30days'

  useEffect(() => {
    const HISTORY_KEY = 'linguacare_exercise_history';
    const FEEDBACK_KEY = 'linguacare_admin_feedback';
    try {
      const historyJson = localStorage.getItem(HISTORY_KEY);
      if (historyJson) {
        const allHistory: ExerciseResult[] = JSON.parse(historyJson);
        const userHistory = allHistory.filter(item => item.userEmail === user.email);
        setHistory(userHistory);
      }
      
      const feedbackJson = localStorage.getItem(FEEDBACK_KEY);
      if (feedbackJson) {
          const allFeedback: AdminFeedback[] = JSON.parse(feedbackJson);
          const userFeedback = allFeedback.filter(f => f.userEmail === user.email);
          setAdminFeedback(userFeedback);
          if (userFeedback.some(f => !f.read)) {
              playNotification();
          }
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, [user.email, playNotification]);

    useEffect(() => {
        let newFilteredHistory = [...history];

        // Apply phrase filter
        if (phraseFilter.trim() !== '') {
            newFilteredHistory = newFilteredHistory.filter(item =>
                item.phrase.toLowerCase().includes(phraseFilter.toLowerCase())
            );
        }

        // Apply score filter
        if (scoreFilter !== 'all') {
            newFilteredHistory = newFilteredHistory.filter(item => {
                if (scoreFilter === 'good') return item.score >= 75;
                if (scoreFilter === 'okay') return item.score >= 50 && item.score < 75;
                if (scoreFilter === 'bad') return item.score < 50;
                return true;
            });
        }

        // Apply date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const daysToSubtract = dateFilter === '7days' ? 7 : 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(now.getDate() - daysToSubtract);

            newFilteredHistory = newFilteredHistory.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= cutoffDate;
            });
        }

        setFilteredHistory(newFilteredHistory);
    }, [history, phraseFilter, scoreFilter, dateFilter]);
    
    const handleDismissFeedback = (id: string) => {
        const updatedFeedback = adminFeedback.map(f => f.id === id ? { ...f, read: true } : f);
        setAdminFeedback(updatedFeedback);
        try {
            const FEEDBACK_KEY = 'linguacare_admin_feedback';
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updatedFeedback));
        } catch (e) {
            console.error("Failed to save feedback status to localStorage", e);
        }
    };

    const unreadFeedback = adminFeedback.filter(f => !f.read);

  return (
    <div className="animate-fade-in">
        <div className="w-full max-w-5xl mx-auto space-y-8">
            
            <div className="animate-fade-in">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    Welcome back, <span className="text-teal-600">{user.name}</span>!
                </h1>
                <p className="text-slate-600 mt-1">Here's a quick overview of your activities.</p>
            </div>

            {unreadFeedback.length > 0 && (
                <div className="space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <h2 className="text-xl font-semibold text-slate-700">Feedback from Your Therapist</h2>
                    <div className="space-y-3">
                        {unreadFeedback.map(feedback => (
                             <div key={feedback.id} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg flex items-start gap-4">
                                <InfoCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-semibold text-blue-800">New Message</p>
                                    <p className="text-blue-700 text-sm mt-1">{feedback.message}</p>
                                    <p className="text-xs text-blue-500 mt-2">{new Date(feedback.date).toLocaleString()}</p>
                                </div>
                                <button onClick={() => handleDismissFeedback(feedback.id)} className="p-1.5 text-blue-500 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors" aria-label="Dismiss feedback">
                                    <XIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <h2 className="text-xl font-semibold text-slate-700">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                        onClick={() => onNavigate('exercises')}
                        className="bg-white p-6 rounded-xl text-left shadow-md hover:shadow-xl hover:-translate-y-1 transition-all group border border-slate-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-teal-100 text-teal-600 p-3 rounded-full group-hover:scale-110 transition-transform">
                                <ExercisesIcon />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Start an Exercise</h3>
                                <p className="text-slate-600 text-sm">Choose from pronunciation, listening, and more.</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="space-y-4 pt-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <h2 className="text-xl font-semibold text-slate-700">Recent Practice Sessions</h2>
                
                {history.length > 0 && (
                     <div className="bg-white p-4 rounded-xl space-y-3 md:space-y-0 md:flex md:items-center md:gap-4 border border-slate-200">
                        <div className="flex-1">
                             <label htmlFor="phrase-filter" className="block text-sm font-medium text-slate-600 mb-1">Filter by phrase</label>
                             <input 
                                id="phrase-filter"
                                type="text" 
                                value={phraseFilter}
                                onChange={(e) => setPhraseFilter(e.target.value)}
                                placeholder="e.g., 'seashells'"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div>
                             <label htmlFor="score-filter" className="block text-sm font-medium text-slate-600 mb-1">By score</label>
                             <select 
                                id="score-filter"
                                value={scoreFilter}
                                onChange={(e) => setScoreFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                             >
                                 <option value="all">All Scores</option>
                                 <option value="good">Good (75+)</option>
                                 <option value="okay">Okay (50-74)</option>
                                 <option value="bad">Needs Work (&lt;50)</option>
                             </select>
                        </div>
                         <div>
                             <label htmlFor="date-filter" className="block text-sm font-medium text-slate-600 mb-1">By date</label>
                             <select
                                 id="date-filter"
                                 value={dateFilter}
                                 onChange={(e) => setDateFilter(e.target.value)}
                                 className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                             >
                                 <option value="all">All Time</option>
                                 <option value="7days">Last 7 Days</option>
                                 <option value="30days">Last 30 Days</option>
                             </select>
                         </div>
                     </div>
                )}

                {history.length > 0 ? (
                    filteredHistory.length > 0 ? (
                        <div className="space-y-3">
                            {filteredHistory.slice(0, 5).map((item) => {
                                const isExpanded = expandedHistoryId === item.id;
                                const scoreColor = item.score >= 75 ? 'bg-green-500' : item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                                return (
                                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl transition-all hover:shadow-md hover:border-teal-200 overflow-hidden">
                                        <button
                                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                                            className="w-full p-4 flex items-center justify-between gap-4 text-left"
                                            aria-expanded={isExpanded}
                                            aria-controls={`history-details-${item.id}`}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="flex-shrink-0">
                                                    <div className={`flex items-center justify-center w-14 h-14 rounded-full text-white font-bold text-xl ${scoreColor}`}>
                                                        {item.score}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-800 truncate">"{item.phrase}"</p>
                                                    <p className="text-sm text-slate-500">
                                                        {new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                        
                                        {isExpanded && item.feedback && (
                                            <div 
                                                id={`history-details-${item.id}`}
                                                role="region"
                                                className="p-4 bg-slate-50 border-t border-slate-200 space-y-4 animate-fade-in">
                                                <div>
                                                    <p className="font-semibold text-slate-700 text-sm">Feedback Summary:</p>
                                                    <p className="text-slate-600 text-sm italic">"{item.feedback.summary}"</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-700 text-sm mb-2">Word Analysis:</p>
                                                    <div className="space-y-1.5">
                                                        {item.feedback.wordAnalysis.map((word, index) => (
                                                            <div key={index} className={`flex items-start gap-2 text-sm ${word.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                                                <div className="flex-shrink-0 mt-0.5">
                                                                    {word.isCorrect ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">{word.word}</span>
                                                                    {!word.isCorrect && word.tip && <span className="text-slate-600 ml-2 font-normal">- "{word.tip}"</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-slate-100 p-6 rounded-lg text-center">
                            <p className="text-slate-600">No sessions match your current filters.</p>
                        </div>
                    )
                ) : (
                    <div className="bg-slate-100 p-6 rounded-lg text-center">
                        <p className="text-slate-600">You haven't completed any exercises yet.</p>
                        <button 
                            onClick={() => onNavigate('exercises')}
                            className="mt-4 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors text-sm"
                        >
                            Start Your First Exercise
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};