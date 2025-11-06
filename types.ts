export type UserRole = 'user' | 'admin';

export interface User {
  name: string;
  role: UserRole;
  email: string;
  signupDate?: string;
}

export interface WordFeedback {
  word: string;
  isCorrect: boolean;
  userPronunciationError?: string; // What the AI thinks the user said wrong.
  tip?: string;
  pronunciationGuide?: string;
}

export interface PronunciationFeedback {
  overallScore: number;
  summary: string;
  wordAnalysis: WordFeedback[];
}

export interface DetailedPhraseAnalysis {
  overallPronunciationGuide: string;
  challengingWords: {
    word: string;
    syllables: string;
    phoneticGuide: string;
    commonMistakes: string[];
    practiceTip: string;
  }[];
}

export type AgeGroup = 'kids' | 'adults';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'english' | 'tamil' | 'malayalam';

export interface ExerciseSettings {
  language: Language;
  ageGroup: AgeGroup;
  difficulty: Difficulty;
}

export interface ExerciseResult {
  id: string;
  phrase: string;
  score: number;
  date: string;
  feedback: PronunciationFeedback;
  userEmail: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export interface AdminFeedback {
  id: string;
  userEmail: string;
  message: string;
  date: string;
  read: boolean;
  context?: {
    phrase?: string;
  };
}

export interface UserFeedback {
  id: string;
  userEmail: string;
  userName: string;
  type: 'bug' | 'suggestion' | 'other';
  message: string;
  date: string;
  status: 'new' | 'viewed' | 'resolved';
}

export type Page = 'dashboard' | 'exercises' | 'pronunciation_exercise' | 'listening_exercise' | 'schedule' | 'settings' | 'admin_panel';