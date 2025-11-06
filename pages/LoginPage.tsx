import React, { useState } from 'react';
import type { User, UserRole } from '../types';
import { LogoIcon, ArrowLeftIcon } from '../components/Icons';

interface LoginPageProps {
  role: UserRole;
  onLogin: (user: User) => void;
  onBack: () => void;
}

const USERS: User[] = [
    { name: 'Patient', role: 'user', email: 'patient@linguacare.com' },
    { name: 'Admin', role: 'admin', email: 'admin@linguacare.com' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ role, onLogin, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(role === 'admin' ? 'admin@linguacare.com' : 'patient@linguacare.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const title = role === 'admin' ? 'Therapist / Admin Sign In' : 'Patient / User Sign In';
  const defaultUser = USERS.find(u => u.role === role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const foundUser = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser && foundUser.role === role && password) {
        const loggedInUser: User = {
            ...foundUser,
            name: name.trim() || foundUser.name,
        };
        onLogin(loggedInUser);
    } else {
        setError('Invalid credentials for this role. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-2">
      {/* Branded Side */}
      <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600 p-12 text-white text-center relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="relative z-10 animate-fade-in-up">
          <LogoIcon className="w-32 h-32" />
          <h1 className="text-5xl font-bold mt-6">Linguacare</h1>
          <p className="mt-4 text-xl opacity-90">Your voice, our care.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center md:hidden animate-fade-in-up">
                <div className="flex justify-center">
                    <LogoIcon className="w-20 h-20 text-teal-600"/>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mt-4">
                    Welcome to Linguacare
                </h1>
            </div>
          
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 relative">
                <button 
                    onClick={onBack} 
                    className="absolute top-4 left-4 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                    aria-label="Go back to role selection"
                >
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <h2 id="login-title" className="text-2xl font-bold text-slate-800">
                        {title}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="login-title">
                     <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name (Optional)</label>
                        <input 
                            type="text" 
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition"
                            placeholder={defaultUser?.name || 'John Doe'}
                        />
                    </div>
                    <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                        <input 
                            type="email" 
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <label htmlFor="password"className="block text-sm font-medium text-slate-700">Password</label>
                        <input 
                            type="password" 
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 text-center pt-1 animate-fade-in-up" style={{ animationDelay: '450ms' }}>{error}</p>}

                    <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <button
                            type="submit"
                            className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-100"
                        >
                            Log In
                        </button>
                    </div>
                     <div className="text-xs text-slate-500 text-center pt-2 space-y-1 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <p>
                            For demo purposes, use email:
                            <br />
                            <span className="font-mono bg-slate-100 px-1 rounded">{defaultUser?.email}</span>
                        </p>
                        <p>(any password works)</p>
                    </div>
                </form>
            </div>
            <footer className="text-center text-xs text-slate-400">
                <p>&copy; {new Date().getFullYear()} Linguacare. All rights reserved.</p>
            </footer>
        </div>
      </div>
    </div>
  );
};