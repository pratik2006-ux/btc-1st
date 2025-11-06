
import { GoogleGenAI } from "@google/genai";
import type { ChartDataPoint } from '../types';

// IMPORTANT: This key is automatically managed by the environment.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Fetches a speculative 15-minute prediction for BTC price from the Gemini API.
 * @param chartData A recent slice of chart data points (up to 30 minutes).
 * @returns A promise that resolves to the prediction text.
 */
export const fetchBtcPrediction = async (chartData: ChartDataPoint[]): Promise<string> => {
    if (chartData.length === 0) {
        throw new Error("Cannot generate prediction with no data.");
    }

    try {
        const latestPrice = chartData[chartData.length - 1].price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        
        // To provide better context, we sample up to 60 data points from the recent history.
        // This gives a broader view of the trend over the last 30 minutes.
        const DESIRED_POINTS = 60;
        let sampledData: ChartDataPoint[];

        if (chartData.length <= DESIRED_POINTS) {
            sampledData = chartData;
        } else {
            const step = Math.floor(chartData.length / DESIRED_POINTS);
            sampledData = chartData.filter((_, index) => index % step === 0);
        }
        
        // Ensure the most recent data point is always included for accuracy
        if (chartData.length > 0 && sampledData[sampledData.length - 1].time !== chartData[chartData.length - 1].time) {
            sampledData.push(chartData[chartData.length - 1]);
        }

        const dataString = sampledData
            .map(p => `[${new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}, ${p.price.toFixed(2)}]`)
            .join(', ');

        const prompt = `
            You are a succinct financial analyst providing speculative insights for a crypto dashboard.
            Based on the recent BTC/USD price trend shown in the following data from the last ~30 minutes (format: [time, price]), provide a brief, one-sentence outlook for the next 15 minutes.
            The most recent price is ${latestPrice}.
            Focus on potential short-term momentum and volatility. Do not use overly confident or definitive language. Do not give financial advice.
            Keep your analysis under 30 words.

            Data: ${dataString}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error fetching prediction from Gemini API:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
            throw new Error("AI prediction service is currently experiencing high demand. Please wait a moment.");
        }
        throw new Error("Failed to generate AI prediction. The service may be temporarily unavailable.");
    }
};
