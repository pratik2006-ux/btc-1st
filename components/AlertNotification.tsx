import React, { useState, useEffect } from 'react';

interface AlertNotificationProps {
  message: string | null;
  onClose: () => void;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({ message, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                handleClose();
            }, 5000); // Auto-dismiss after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleClose = () => {
        setIsVisible(false);
        // Allow animation to finish before calling onClose
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!message) {
        return null;
    }

    return (
        <div 
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-sm p-4 rounded-xl shadow-lg border border-gray-700 bg-gray-800/80 backdrop-blur-md text-white z-50 transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            role="alert"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0 text-amber-400">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-200">
                       {message}
                    </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button onClick={handleClose} className="inline-flex text-gray-400 hover:text-white">
                        <span className="sr-only">Close</span>
                        &times;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertNotification;