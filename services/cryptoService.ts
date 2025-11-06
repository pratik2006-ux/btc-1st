import type { 
    ChartDataPoint, 
    CryptoCompareHistoMinuteResponse
} from '../types';

const API_BASE_URL = 'https://min-api.cryptocompare.com/data';
const HISTO_MINUTE_URL = `${API_BASE_URL}/v2/histominute?fsym=BTC&tsym=USD&limit=1439`;

/**
 * A generic fetch wrapper for the CryptoCompare API that includes robust error handling.
 * @param url The API endpoint to fetch.
 * @returns The JSON response data.
 * @throws An error with a user-friendly message if the fetch fails.
 */
async function apiFetch<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.error('Network error during fetch:', error);
    throw new Error('Network error. Please check your internet connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('API rate limit reached. Please wait a moment before trying again.');
    }
    if (response.status >= 500) {
      throw new Error('The cryptocurrency data service is temporarily unavailable. Please try again later.');
    }
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // CryptoCompare specific error format check
  if (data.Response === 'Error') {
    console.error('API returned an error:', data.Message);
    throw new Error(data.Message || 'An unknown API error occurred.');
  }
  
  return data;
}

/**
 * Fetches the initial 24 hours of BTC price data for the chart.
 * @returns A promise that resolves to an array of chart data points.
 */
export const fetchInitialBtcChartData = async (): Promise<ChartDataPoint[]> => {
  try {
    const data = await apiFetch<CryptoCompareHistoMinuteResponse>(HISTO_MINUTE_URL);
    
    if (!data.Data || !data.Data.Data) {
      throw new Error('Invalid or empty historical data received from API.');
    }

    return data.Data.Data.map(({ time, close }) => ({
      time: time * 1000, // Convert Unix timestamp from seconds to milliseconds
      price: close,
    }));
  } catch (error) {
    console.error("Error processing initial BTC chart data:", error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
};
