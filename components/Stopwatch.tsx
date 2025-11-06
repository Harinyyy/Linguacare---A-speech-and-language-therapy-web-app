import React, { useState, useEffect } from 'react';
import { ClockIcon } from './Icons';

interface StopwatchProps {
    startTime: number;
}

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts = [];
    if (hours > 0) parts.push(String(hours).padStart(2, '0'));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));

    return parts.join(':');
};

export const Stopwatch: React.FC<StopwatchProps> = ({ startTime }) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        // Set initial time immediately
        const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(initialElapsed);

        const timerId = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(elapsed);
        }, 1000);

        return () => clearInterval(timerId);
    }, [startTime]);

    return (
        <div className="flex items-center gap-2 text-slate-600 font-medium font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-sm" aria-label={`Session timer: ${formatTime(elapsedTime)}`}>
            <ClockIcon className="h-5 w-5" />
            <span>{formatTime(elapsedTime)}</span>
        </div>
    );
};