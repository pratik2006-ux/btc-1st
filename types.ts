export type ChartDataPoint = {
  time: number;
  price: number;
};

export type Trend = 'up' | 'down' | 'stable';

export type TimeRange = '10S' | '1M' | '15M' | '30M' | '1H' | '6H' | '12H' | '24H';

export interface CryptoCompareHistoMinuteDataPoint {
  time: number;
  close: number;
}

export interface CryptoCompareHistoMinuteResponse {
  Response: string;
  Message: string;
  Data: {
    Aggregated: boolean;
    TimeFrom: number;
    TimeTo: number;
    Data: CryptoCompareHistoMinuteDataPoint[];
  };
}

export interface PriceAlert {
  id: string;
  threshold: number;
  condition: 'above' | 'below';
  createdAt: number;
}
