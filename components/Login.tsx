import React, { useState } from 'react';
import type { User } from '../types';
import { LogoIcon } from './Icons';

interface LoginProps {
  onLogin: (user: User) => void;
}

const USERS: User[] = [
    { name: 'Patient', role: 'user', email: 'patient@linguacare.com' },
    { name: 'Admin', role: 'admin', email: 'admin@linguacare.com' },
];

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // For this simulation, we'll log in based on email.
    const foundUser = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser && password) {
        // Use the entered name, or fall back to the default name for the account.
        const loggedInUser: User = {
            ...foundUser,
            name: name.trim() || foundUser.name,
        };
        onLogin(loggedInUser);
    } else {
        setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-2">
      {/* Branding Side */}
      <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600 p-12 text-white text-center relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-white/10 rounded-full" />
        <LogoIcon className="w-32 h-32" />
        <h1 className="text-5xl font-bold mt-6">Linguacare</h1>
        <p className="mt-4 text-xl opacity-90">Your voice, our care.</p>
      </div>

      {/* Form Side */}
      <div className="flex flex-col items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center md:hidden">
                <div className="flex justify-center">
                    <LogoIcon className="w-20 h-20 text-teal-600"/>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mt-4">
                    Welcome to Linguacare
                </h1>
            </div>
          
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800">
                        Sign in to your account
                    </h2>
                    <p className="text-slate-500 mt-2">
                        Let's get started with your session.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                        <input 
                            type="text" 
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
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
                    <div>
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

                    {error && <p className="text-sm text-red-600 text-center pt-1">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-100"
                    >
                        Log In
                    </button>
                    <div className="text-xs text-slate-500 text-center pt-2 space-y-1">
                        <p>For demo purposes, you can use:</p>
                        <p>
                            <span className="font-mono bg-slate-100 px-1 rounded">patient@linguacare.com</span>
                        </p>
                         <p>
                            <span className="font-mono bg-slate-100 px-1 rounded">admin@linguacare.com</span>
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