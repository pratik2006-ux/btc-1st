import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint, TimeRange } from '../types';

interface PriceChartProps {
  data: ChartDataPoint[];
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}

const timeRanges: { label: TimeRange; value: TimeRange }[] = [
    { label: '10S', value: '10S' },
    { label: '1M', value: '1M' },
    { label: '15M', value: '15M' },
    { label: '30M', value: '30M' },
    { label: '1H', value: '1H' },
    { label: '6H', value: '6H' },
    { label: '12H', value: '12H' },
    { label: '24H', value: '24H' },
];

const ResetIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.006h-4.992v4.992h4.992z" />
    </svg>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-md border border-gray-600 shadow-lg">
        <p className="text-gray-300 text-sm mb-1">{`Time: ${new Date(label).toLocaleString()}`}</p>
        <p className="text-amber-400 font-bold">{`Price: ${payload[0].value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}</p>
      </div>
    );
  }
  return null;
};

const PriceChart: React.FC<PriceChartProps> = ({ data, timeRange, setTimeRange }) => {
  const [xDomain, setXDomain] = useState<[number, number] | undefined>(undefined);
  const [isZoomed, setIsZoomed] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; domain: [number, number] } | null>(null);

  const fullXDomain = useMemo((): [number, number] | undefined => {
      if (!data || data.length === 0) return undefined;
      return [data[0].time, data[data.length - 1].time];
  }, [data]);

  useEffect(() => {
    setXDomain(fullXDomain);
    setIsZoomed(false);
  }, [data, fullXDomain]);
  
  const yDomain = useMemo((): [number, number] | undefined => {
    if (!data || data.length === 0) return undefined;
    const visibleData = isZoomed && xDomain ? data.filter(d => d.time >= xDomain[0] && d.time <= xDomain[1]) : data;
    if (visibleData.length === 0) return undefined;

    const prices = visibleData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.05; // 5% padding
    return [min - padding, max + padding];
  }, [data, xDomain, isZoomed]);


  const handleResetZoom = useCallback(() => {
    setXDomain(fullXDomain);
    setIsZoomed(false);
  }, [fullXDomain]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!xDomain) return;
    panStartRef.current = { x: e.clientX, domain: xDomain };
    if (chartRef.current) {
        chartRef.current.style.cursor = 'grabbing';
    }
  }, [xDomain]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!panStartRef.current || !fullXDomain) return;
    
    const dx = e.clientX - panStartRef.current.x;
    const chartWidth = chartRef.current?.clientWidth;
    if (!chartWidth) return;

    const domainWidth = panStartRef.current.domain[1] - panStartRef.current.domain[0];
    const dxTime = (dx / chartWidth) * domainWidth;

    let newDomainStart = panStartRef.current.domain[0] - dxTime;
    let newDomainEnd = panStartRef.current.domain[1] - dxTime;

    if(newDomainStart < fullXDomain[0]) {
        newDomainStart = fullXDomain[0];
        newDomainEnd = newDomainStart + domainWidth;
    }
    if(newDomainEnd > fullXDomain[1]) {
        newDomainEnd = fullXDomain[1];
        newDomainStart = newDomainEnd - domainWidth;
    }

    setXDomain([newDomainStart, newDomainEnd]);
    setIsZoomed(true);
  }, [fullXDomain]);

  const handleMouseUp = useCallback(() => {
    panStartRef.current = null;
     if (chartRef.current) {
        chartRef.current.style.cursor = 'grab';
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!xDomain || !fullXDomain) return;

    const chart = chartRef.current;
    if (!chart) return;

    const rect = chart.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseRatio = mouseX / rect.width;
    
    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;
    
    const currentSpan = xDomain[1] - xDomain[0];
    const newSpan = Math.max(currentSpan * zoomFactor, 60 * 1000 * 5); // Minimum 5-minute window

    const timeAtMouse = xDomain[0] + currentSpan * mouseRatio;
    
    let newStart = timeAtMouse - newSpan * mouseRatio;
    let newEnd = timeAtMouse + newSpan * (1 - mouseRatio);

    if (newEnd > fullXDomain[1]) newEnd = fullXDomain[1];
    if (newStart < fullXDomain[0]) newStart = fullXDomain[0];
    if (newEnd - newStart < newSpan) {
        newStart = newEnd - newSpan;
        if(newStart < fullXDomain[0]) newStart = fullXDomain[0];
    }
    if (newEnd - newStart < newSpan) {
        newEnd = newStart + newSpan;
        if(newEnd > fullXDomain[1]) newEnd = fullXDomain[1];
    }

    setXDomain([newStart, newEnd]);
    setIsZoomed(true);

  }, [xDomain, fullXDomain]);


  if (!data || data.length === 0) {
    return <div className="text-center p-10 text-gray-500">No chart data available for the selected range.</div>;
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 w-full">
      <div className="flex justify-end mb-4">
        <div className="bg-gray-700/50 p-1 rounded-lg flex space-x-1 items-center flex-wrap">
            {isZoomed && (
                <button
                    onClick={handleResetZoom}
                    className="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-600/50 mr-1"
                    title="Reset Zoom"
                >
                    <ResetIcon />
                </button>
            )}
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                timeRange === range.value
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-400 hover:bg-gray-600/50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div 
        className="h-80 w-full"
        ref={chartRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: 'grab' }}
        >
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="time"
              type="number"
              domain={xDomain}
              allowDataOverflow
              tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="price"
              orientation="right"
              domain={yDomain}
              allowDataOverflow
              tickFormatter={(price) => `$${(price / 1000).toFixed(1)}k`}
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#fbbf24" 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                strokeWidth={2} 
                isAnimationActive={false}
                activeDot={{ r: 6, stroke: 'rgba(255,255,255,0.7)', strokeWidth: 2, fill: '#fbbf24' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;