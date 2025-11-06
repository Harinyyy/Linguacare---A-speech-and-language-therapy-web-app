import React from 'react';
import type { User } from '../types';
import { LogoIcon } from './Icons';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
}


export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200 z-20 sticky top-0">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
            <div>
                <LogoIcon className="w-14 h-14 text-teal-600" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 ml-3">
              Linguacare
            </h1>
        </div>
        
        {user && (
            <div className="flex items-center gap-4">
                <span className="text-slate-600 hidden sm:block">Welcome, <span className="font-semibold">{user.name}</span></span>
                <button
                    onClick={onLogout}
                    className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors text-sm"
                    aria-label="Log out"
                >
                    Log Out
                </button>
            </div>
        )}
      </div>
    </header>
  );
};