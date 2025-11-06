import React, { useEffect, useState } from 'react';
import { CoffeeIcon } from './Icons';

interface BreakReminderModalProps {
    breakEndTime: number | null;
}

export const BreakReminderModal: React.FC<BreakReminderModalProps> = ({ breakEndTime }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!breakEndTime) return;

        const calculateTimeLeft = () => {
            const remaining = breakEndTime - Date.now();
            if (remaining <= 0) {
                return '00:00';
            }
            const minutes = Math.floor((remaining / 1000) / 60);
            const seconds = Math.floor((remaining / 1000) % 60);
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };

        // Set initial value
        setTimeLeft(calculateTimeLeft());

        const intervalId = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (newTimeLeft === '00:00') {
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [breakEndTime]);


    if (!breakEndTime) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
            role="dialog"
            aria-modal="true"
            aria-labelledby="break-reminder-title"
        >
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8 text-center space-y-5 transform transition-all animate-modal-pop-in"
            >
                <div className="flex justify-center">
                    <CoffeeIcon className="h-12 w-12 text-teal-500" />
                </div>

                <h2 id="break-reminder-title" className="text-2xl font-bold text-slate-800">
                    Time for a Break!
                </h2>

                <p className="text-slate-600">
                    You've been practicing hard. To stay sharp, you must take a 10-minute break. The exercise will resume automatically.
                </p>

                <div className="py-2">
                    <p className="text-sm text-slate-500">Time remaining:</p>
                    <div className="text-5xl font-bold font-mono text-teal-600 tracking-wider">
                        {timeLeft}
                    </div>
                </div>

                <div
                    className="w-full bg-slate-200 text-slate-600 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                >
                    Break in progress...
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-fast { animation: fadeIn 0.3s ease-out forwards; }
                
                @keyframes popIn { 
                    from { opacity: 0; transform: scale(0.95) translateY(10px); } 
                    to { opacity: 1; transform: scale(1) translateY(0); } 
                }
                .animate-modal-pop-in { animation: popIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};