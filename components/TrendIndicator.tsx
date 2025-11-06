
import React, { useState, useEffect, useRef } from 'react';
import type { Trend } from '../types';

interface TrendIndicatorProps {
  currentPrice: number | null;
  trend: Trend;
  lastUpdated: Date | null;
  onOpenAlertModal: () => void;
  alertCount: number;
  pollingError?: boolean;
}

const BellIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

const ArrowUpIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75" />
  </svg>
);

const ArrowDownIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-6.75-6.75M12 19.5l6.75-6.75" />
  </svg>
);

const MinusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
  </svg>
);

const trendConfig = {
    up: {
        icon: <ArrowUpIcon />,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        text: 'Trending Up',
    },
    down: {
        icon: <ArrowDownIcon />,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        text: 'Trending Down',
    },
    stable: {
        icon: <MinusIcon />,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        text: 'Stable',
    },
};

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ currentPrice, trend, lastUpdated, onOpenAlertModal, alertCount, pollingError }) => {
    const config = trendConfig[trend];
    const [isPriceAnimating, setIsPriceAnimating] = useState(false);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setIsPriceAnimating(true);
        const timer = setTimeout(() => setIsPriceAnimating(false), 500);
        return () => clearTimeout(timer);
    }, [currentPrice]);


    const formatCurrency = (value: number | null) => {
        if (value === null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700 h-full flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-grow">
                    <div className="flex items-center justify-between">
                         <p className="text-gray-400 text-sm font-medium">Current BTC Price</p>
                         <button 
                            onClick={onOpenAlertModal}
                            className="relative text-gray-400 hover:text-white transition-colors duration-200"
                            aria-label="Set price alert"
                         >
                             <BellIcon />
                             {alertCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                                    {alertCount}
                                </span>
                             )}
                         </button>
                    </div>
                    <p className={`text-4xl font-bold mt-1 transition-all duration-500 ease-in-out ${isPriceAnimating ? 'scale-105 text-amber-300' : 'scale-100 text-white'}`}>
                        {formatCurrency(currentPrice)}
                    </p>
                    {lastUpdated && (
                        <div className="flex items-center mt-2">
                             <p className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                             {pollingError && (
                                <div className="flex items-center text-yellow-400 text-xs ml-3 animate-pulse" title="Live data feed is currently interrupted. Retrying...">
                                    <WarningIcon />
                                    <span>Feed Interrupted</span>
                                </div>
                             )}
                        </div>
                    )}
                </div>
                <div className={`flex items-center space-x-3 p-3 rounded-lg ${config.bgColor} border border-gray-700/50 self-stretch sm:self-center`}>
                    <div className={config.color}>
                        {config.icon}
                    </div>
                    <div>
                        <p className={`font-semibold ${config.color}`}>{config.text}</p>
                        <p className="text-xs text-gray-400">vs 15 min ago</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrendIndicator;