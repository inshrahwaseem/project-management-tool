import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Assistant Service — Powered by Google Gemini
 * Provides smart task breakdowns, deadline suggestions, and bottleneck detection.
 */

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export class AIService {
  /**
   * Breakdown a task into smaller, actionable sub-tasks.
   */
  static async suggestSubTasks(title: string, description?: string) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('AI API Key not configured');
    }

    const prompt = `You are a project management assistant. Breakdown the following task into 4-6 small, actionable sub-tasks. 
    Return as a JSON array of strings only.
    Task Title: ${title}
    Task Description: ${description || 'No description'}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Simple JSON extraction to be safe
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }

  /**
   * Suggest a realistic deadline based on task complexity.
   */
  static async suggestDeadline(title: string, priority: string) {
    const prompt = `Given a task "${title}" with priority ${priority}, suggest how many days it should take to complete optimally. 
    Return a single integer representind days (e.g. 3).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const days = parseInt(text.replace(/\D/g, '')) || 3;
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  }

  /**
   * Detect bottlenecks in a project based on task distribution.
   */
  static analyzeBottlenecks(tasks: any[]) {
    const statusCounts = tasks.reduce((acc: any, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    // Heuristic: If more than 40% of tasks are in 'IN_PROGRESS' or 'IN_REVIEW', it's a bottleneck
    const total = tasks.length;
    if (total === 0) return null;

    const reviewRatio = (statusCounts['IN_REVIEW'] || 0) / total;
    if (reviewRatio > 0.3) {
      return {
        type: 'IN_REVIEW',
        message: 'High concentration of tasks in Review. Code quality or testing might be slow.',
        severity: 'MEDIUM'
      };
    }

    return null;
  }
}
