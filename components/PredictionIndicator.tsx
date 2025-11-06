
import React, { useState } from 'react';

interface PredictionIndicatorProps {
  prediction: string | null;
  isLoading: boolean;
  error: string | null;
}

const BrainIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-amber-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const ChevronIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);


const PredictionIndicator: React.FC<PredictionIndicatorProps> = ({ prediction, isLoading, error }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-gray-400 animate-pulse">Generating analysis...</p>;
        }
        if (error) {
            return <p className="text-red-400 text-sm">{error}</p>;
        }
        if (prediction) {
            return <p className="text-gray-200 leading-relaxed">{`"${prediction}"`}</p>;
        }
        return <p className="text-gray-500">No prediction available.</p>;
    };
    
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="w-full flex items-center justify-between text-left focus:outline-none"
                aria-expanded={isExpanded}
                aria-controls="prediction-content"
            >
                <div className="flex items-center">
                    <BrainIcon />
                    <h3 className="text-lg font-bold text-white">AI-Powered 15-Min Outlook</h3>
                </div>
                <ChevronIcon isExpanded={isExpanded} />
            </button>

            <div
                id="prediction-content"
                className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr] mt-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="flex items-center min-h-[3rem]">
                        {renderContent()}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-right">
                        Powered by Gemini. For informational purposes only.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PredictionIndicator;