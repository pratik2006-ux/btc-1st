import React, { useState, useEffect } from 'react';

const ClockIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const LiveClock: React.FC = () => {
    const [time, setTime] = useState('');

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
    });

    useEffect(() => {
        const updateClock = () => {
            setTime(timeFormatter.format(new Date()));
        };
        
        updateClock();
        const timerId = setInterval(updateClock, 1000);

        return () => {
            clearInterval(timerId);
        };
    }, []);

    return (
        <div className="flex items-center justify-center text-gray-400 text-sm font-mono tracking-wider">
            <ClockIcon />
            <span className="font-bold text-amber-400 text-base">{time}</span>
        </div>
    );
};

export default LiveClock;
