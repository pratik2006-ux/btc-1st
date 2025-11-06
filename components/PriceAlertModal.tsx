import React, { useState, useEffect } from 'react';
import type { PriceAlert } from '../types';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number | null;
  alerts: PriceAlert[];
  onAddAlert: (alert: PriceAlert) => void;
  onDeleteAlert: (id: string) => void;
}

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.124 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);


const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ isOpen, onClose, currentPrice, alerts, onAddAlert, onDeleteAlert }) => {
    const [threshold, setThreshold] = useState('');
    const [condition, setCondition] = useState<'above' | 'below'>('above');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (currentPrice) {
            setThreshold(currentPrice.toFixed(2));
        }
    }, [isOpen, currentPrice]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const thresholdValue = parseFloat(threshold);
        if (isNaN(thresholdValue) || thresholdValue <= 0) {
            setError('Please enter a valid, positive price.');
            return;
        }
        if (alerts.length >= 5) {
            setError('You can set a maximum of 5 alerts.');
            return;
        }
        setError(null);
        onAddAlert({
            id: crypto.randomUUID(),
            threshold: thresholdValue,
            condition,
            createdAt: Date.now()
        });
        // Do not reset form to allow quick creation of similar alerts
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Set Price Alert</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <div className="p-6 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">Alert me when price is</label>
                            <div className="flex space-x-2">
                                <select 
                                    id="condition"
                                    value={condition} 
                                    onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                                    className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                >
                                    <option value="above">Above</option>
                                    <option value="below">Below</option>
                                </select>
                                <div className="relative flex-1">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
                                    <input 
                                        type="number"
                                        value={threshold}
                                        onChange={(e) => setThreshold(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 pl-7 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                        placeholder="Enter price"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            Set Alert
                        </button>
                    </form>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-200 mb-3">Active Alerts ({alerts.length}/5)</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {alerts.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No active alerts.</p>
                            ) : (
                                alerts.map(alert => (
                                    <div key={alert.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                                        <p className="text-sm text-gray-300">
                                            {`When price is ${alert.condition} `}
                                            <span className="font-bold text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(alert.threshold)}</span>
                                        </p>
                                        <button onClick={() => onDeleteAlert(alert.id)} className="text-gray-500 hover:text-red-400 transition-colors" title="Delete Alert">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceAlertModal;