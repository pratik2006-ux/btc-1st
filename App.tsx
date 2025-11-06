
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchInitialBtcChartData } from './services/cryptoService';
import { fetchBtcPrediction } from './services/predictionService';
import type { ChartDataPoint, Trend, TimeRange, PriceAlert } from './types';
import PriceChart from './components/PriceChart';
import TrendIndicator from './components/TrendIndicator';
import LoadingSpinner from './components/LoadingSpinner';
import PriceAlertModal from './components/PriceAlertModal';
import AlertNotification from './components/AlertNotification';
import LiveClock from './components/LiveClock';
import PredictionIndicator from './components/PredictionIndicator';

const PREDICTION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DATA_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
// Using Binance's aggregate trade stream. This provides a real-time feed that's less noisy
// than individual trades and more closely aligns with aggregated price feeds like Chainlink's.
const WEBSOCKET_URL = 'wss://stream.binance.com:9443/ws/btcusdt@aggTrade';
const RECONNECT_DELAY_MS = 5000; // 5 seconds

const calculateTrend = (data: ChartDataPoint[]): Trend => {
    if (data.length < 2) return 'stable';

    const latestPoint = data[data.length - 1];
    const fifteenMinutesAgo = latestPoint.time - 15 * 60 * 1000;
    const referencePoint = data.slice().reverse().find(p => p.time <= fifteenMinutesAgo);

    if (referencePoint) {
        if (latestPoint.price > referencePoint.price * 1.0005) return 'up';
        if (latestPoint.price < referencePoint.price * 0.9995) return 'down';
    }
    return 'stable';
};

const App: React.FC = () => {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [trend, setTrend] = useState<Trend>('stable');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('24H');
    const [pollingError, setPollingError] = useState<boolean>(false); // Used here for WebSocket connection status
    
    // Price Alert State
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    // AI Prediction State
    const [prediction, setPrediction] = useState<string | null>(null);
    const [isPredictionLoading, setIsPredictionLoading] = useState<boolean>(true);
    const [predictionError, setPredictionError] = useState<string | null>(null);

    const isFetchingPrediction = useRef(false);
    const chartDataRef = useRef<ChartDataPoint[]>([]);
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);


    // Load alerts from localStorage on initial mount
    useEffect(() => {
        try {
            const savedAlerts = localStorage.getItem('btcPriceAlerts');
            if (savedAlerts) {
                setAlerts(JSON.parse(savedAlerts));
            }
        } catch (err) {
            console.error("Failed to load alerts from localStorage", err);
        }
    }, []);

    // Save alerts to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('btcPriceAlerts', JSON.stringify(alerts));
        } catch (err) {
            console.error("Failed to save alerts to localStorage", err);
        }
    }, [alerts]);

    // Keep a ref to the latest chart data to avoid re-triggering the prediction interval effect.
    useEffect(() => {
        chartDataRef.current = chartData;
    }, [chartData]);
    
    // Effect for the initial data load
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchInitialBtcChartData();
                if (data.length > 0) {
                    setChartData(data);
                    setCurrentPrice(data[data.length - 1].price);
                    setLastUpdated(new Date(data[data.length - 1].time));
                    setTrend(calculateTrend(data));
                } else {
                    throw new Error("No initial data loaded. The API may be experiencing issues.");
                }
            } catch (err) {
                setError((err as Error).message);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Effect for real-time price updates via WebSocket
    useEffect(() => {
        if (isLoading || error) return;

        const connect = () => {
            // Ensure no existing connection or reconnect timeout is active
            if (websocketRef.current || reconnectTimeoutRef.current) {
                return;
            }

            const ws = new WebSocket(WEBSOCKET_URL);
            websocketRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connection established');
                setPollingError(false);
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message && message.p) {
                    const latestPrice = parseFloat(message.p);
                    const newPoint: ChartDataPoint = { time: Date.now(), price: latestPrice };

                    // Check for triggered alerts
                    const triggeredAlert = alerts.find(alert => 
                        (alert.condition === 'above' && latestPrice > alert.threshold) ||
                        (alert.condition === 'below' && latestPrice < alert.threshold)
                    );

                    if (triggeredAlert) {
                        const direction = triggeredAlert.condition === 'above' ? 'risen above' : 'dropped below';
                        setNotification(`Price Alert: BTC has ${direction} ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(triggeredAlert.threshold)}`);
                        setAlerts(prev => prev.filter(a => a.id !== triggeredAlert.id));
                    }

                    setChartData(prevChartData => {
                        const cutoff = Date.now() - DATA_WINDOW_MS;
                        const updatedData = prevChartData.filter(p => p.time >= cutoff);
                        const newData = [...updatedData, newPoint];
                        setTrend(calculateTrend(newData));
                        return newData;
                    });

                    setCurrentPrice(latestPrice);
                    setLastUpdated(new Date());

                    if (pollingError) setPollingError(false);
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                setPollingError(true);
                ws.close(); // This will trigger the onclose handler for reconnection logic
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed.');
                websocketRef.current = null;
                if (!reconnectTimeoutRef.current) {
                    setPollingError(true);
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        reconnectTimeoutRef.current = null;
                        connect();
                    }, RECONNECT_DELAY_MS);
                }
            };
        };

        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (websocketRef.current) {
                websocketRef.current.close();
                websocketRef.current = null;
            }
        };
    }, [isLoading, error, alerts, pollingError]);


    // Effect for AI prediction
    useEffect(() => {
        // This effect sets up the prediction interval and should only run once after the initial load.
        if (isLoading || error) return;

        let intervalId: number;

        const getPrediction = async () => {
            if (isFetchingPrediction.current) return;
            
            if (chartDataRef.current.length < 10) {
                console.log("Skipping prediction: not enough data points yet.");
                return;
            }
            
            isFetchingPrediction.current = true;
            setIsPredictionLoading(true);
            setPredictionError(null);
            try {
                const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
                const recentData = chartDataRef.current.filter(p => p.time >= thirtyMinutesAgo);
                const newPrediction = await fetchBtcPrediction(recentData);
                setPrediction(newPrediction);
            } catch (err) {
                setPredictionError((err as Error).message);
                console.error('Failed to fetch prediction:', err);
            } finally {
                setIsPredictionLoading(false);
                isFetchingPrediction.current = false;
            }
        };

        // Use a self-correcting interval to prevent drift
        const runPrediction = () => {
            getPrediction().finally(() => {
               intervalId = window.setTimeout(runPrediction, PREDICTION_INTERVAL_MS);
            });
        };
        
        runPrediction();

        return () => clearTimeout(intervalId);
    }, [isLoading, error]);


    const filteredChartData = useMemo(() => {
        if (!chartData.length) return [];
        
        const now = chartData[chartData.length - 1].time;
        const timeRangeMilliseconds: Record<TimeRange, number> = {
            '10S': 10 * 1000,
            '1M': 60 * 1000,
            '15M': 15 * 60 * 1000,
            '30M': 30 * 60 * 1000,
            '1H': 60 * 60 * 1000,
            '6H': 6 * 60 * 60 * 1000,
            '12H': 12 * 60 * 60 * 1000,
            '24H': 24 * 60 * 60 * 1000,
        };
        
        const cutoffTime = now - timeRangeMilliseconds[timeRange];

        return chartData.filter(point => point.time >= cutoffTime);
    }, [chartData, timeRange]);

    const handleAddAlert = (alert: PriceAlert) => {
        setAlerts(prev => [...prev, alert]);
    };

    const handleDeleteAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
            <main className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
                        BTC/USD Real-Time Trend
                    </h1>
                    <p className="text-center text-gray-400 mt-2 mb-4">
                        Live price chart and trend analysis for Bitcoin.
                    </p>
                    <LiveClock />
                </header>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center my-4">
                        <p className="font-bold">An Error Occurred</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                
                <div className="space-y-8">
                    {!isLoading && !error && currentPrice !== null && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-2">
                                <TrendIndicator
                                    currentPrice={currentPrice}
                                    trend={trend}
                                    lastUpdated={lastUpdated}
                                    onOpenAlertModal={() => setIsAlertModalOpen(true)}
                                    alertCount={alerts.length}
                                    pollingError={pollingError}
                                />
                            </div>
                            <PredictionIndicator 
                                prediction={prediction}
                                isLoading={isPredictionLoading}
                                error={predictionError}
                            />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="h-96 flex items-center justify-center bg-gray-800/50 rounded-xl border border-gray-700">
                            <LoadingSpinner />
                        </div>
                    ) : !error && chartData.length > 0 && (
                        <PriceChart 
                            data={filteredChartData} 
                            timeRange={timeRange}
                            setTimeRange={setTimeRange}
                        />
                    )}
                </div>

                 <footer className="text-center mt-12 text-gray-500 text-sm">
                    <p>
                        Live data from <a href="https://www.binance.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Binance</a>. Chart data from <a href="https://min-api.cryptocompare.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">CryptoCompare</a>.
                    </p>
                    <p className="mt-1">
                        Original request inspired by <a href="https://data.chain.link/streams/btc-usd" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Chainlink Data Streams</a>.
                    </p>
                </footer>
            </main>
            
            <PriceAlertModal
                isOpen={isAlertModalOpen}
                onClose={() => setIsAlertModalOpen(false)}
                currentPrice={currentPrice}
                alerts={alerts}
                onAddAlert={handleAddAlert}
                onDeleteAlert={handleDeleteAlert}
            />

            <AlertNotification
                message={notification}
                onClose={() => setNotification(null)}
            />
        </div>
    );
};

export default App;
