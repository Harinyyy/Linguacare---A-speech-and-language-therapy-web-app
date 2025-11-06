import React from 'react';
import type { UserRole } from '../types';
import { LogoIcon, UserCircleIcon, AdminShieldIcon } from '../components/Icons';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10 animate-fade-in-up">
        <LogoIcon className="w-24 h-24 text-teal-600 mx-auto" />
        <h1 className="text-4xl font-bold text-slate-800 mt-4">Welcome to Linguacare</h1>
        <p className="text-slate-600 mt-2 text-lg">Your voice, our care.</p>
      </div>

      <div className="w-full max-w-md space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-center text-slate-800">
            Choose your login
          </h2>
          <button
            onClick={() => onSelectRole('user')}
            className="w-full flex items-center gap-4 p-5 rounded-lg bg-slate-100 hover:bg-white hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-teal-400 transition-all group duration-300"
          >
            <UserCircleIcon className="w-10 h-10 text-slate-500 group-hover:text-teal-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-800 text-left">Patient / User Login</h3>
              <p className="text-sm text-slate-600 text-left">Access your exercises and track your progress.</p>
            </div>
          </button>
          <button
            onClick={() => onSelectRole('admin')}
            className="w-full flex items-center gap-4 p-5 rounded-lg bg-slate-100 hover:bg-white hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-teal-400 transition-all group duration-300"
          >
            <AdminShieldIcon className="w-10 h-10 text-slate-500 group-hover:text-teal-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-800 text-left">Therapist / Admin Login</h3>
              <p className="text-sm text-slate-600 text-left">Manage patients and review sessions.</p>
            </div>
          </button>
        </div>
      </div>
       <footer className="text-center text-xs text-slate-400 mt-8">
            <p>&copy; {new Date().getFullYear()} Linguacare. All rights reserved.</p>
       </footer>
    </div>
  );
};