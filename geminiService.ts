
import { GoogleGenAI } from "@google/genai";
import { Project, Transaction, ProjectStats } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialHealthReport = async (project: Project, stats: ProjectStats) => {
  const prompt = `
    Analyze the financial health of the following research project:
    Project: ${project.title}
    Funding Agency: ${project.agency}
    Total Budget: ₹${stats.totalAllocated}
    Total Received: ₹${stats.totalReceived}
    Total Spent: ₹${stats.totalSpent}
    Current Balance: ₹${stats.balance}

    Detailed Head-wise Breakdown:
    ${Object.entries(stats.headWise).map(([head, s]) => 
      `- ${head}: Allocated ₹${s.allocated}, Spent ₹${s.spent}, Balance ₹${s.balance}`
    ).join('\n')}

    Provide a concise (3-4 sentence) summary of the financial status, highlighting any budget heads that are overspent or nearing exhaustion, and suggest if the PI needs to request more funds.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Unable to generate AI analysis at this time.";
  }
};
