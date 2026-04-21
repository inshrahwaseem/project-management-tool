import Anthropic from '@anthropic-ai/sdk';

/**
 * AI Assistant Service — Powered by Claude (Anthropic)
 * Provides smart task breakdowns, deadline suggestions, weekly summaries, and bottleneck detection.
 */

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  return new Anthropic({ apiKey });
}

export class AIService {
  /**
   * Breakdown a task into smaller, actionable sub-tasks.
   */
  static async suggestSubTasks(title: string, description?: string): Promise<string[]> {
    const client = getClient();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a project management assistant. Breakdown the following task into 4-6 small, actionable sub-tasks.
Return ONLY a JSON array of strings, nothing else.
Task Title: ${title}
Task Description: ${description || 'No description'}`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }

  /**
   * Suggest a realistic deadline based on task complexity.
   */
  static async suggestDeadline(title: string, priority: string): Promise<Date> {
    const client = getClient();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: `Given a task "${title}" with priority ${priority}, suggest how many days it should take to complete optimally. Return a single integer only (e.g. 3).`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '3';
    const days = parseInt(text.replace(/\D/g, '')) || 3;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  }

  /**
   * Generate an AI-powered weekly summary for a project.
   */
  static async generateWeeklySummary(projectTitle: string, stats: {
    completed: number;
    created: number;
    overdue: number;
    inProgress: number;
  }): Promise<string> {
    const client = getClient();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are a project management assistant. Write a concise, professional weekly status summary for the project "${projectTitle}".
Stats this week:
- Tasks completed: ${stats.completed}
- Tasks created: ${stats.created}
- Overdue tasks: ${stats.overdue}
- Currently in progress: ${stats.inProgress}
Keep it to 3-4 sentences, professional tone, highlight risks if any.`,
        },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : 'No summary available.';
  }

  /**
   * Expand a task title into a full description.
   */
  static async expandDescription(title: string): Promise<string> {
    const client = getClient();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are a project management assistant. Given the task title "${title}", write a professional task description with acceptance criteria. Keep it concise (3-5 bullet points). Use markdown formatting.`,
        },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  /**
   * Detect bottlenecks in a project based on task distribution.
   */
  static analyzeBottlenecks(tasks: any[]) {
    const statusCounts = tasks.reduce((acc: any, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const total = tasks.length;
    if (total === 0) return null;

    const reviewRatio = (statusCounts['IN_REVIEW'] || 0) / total;
    const overdueCount = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    ).length;

    if (overdueCount > total * 0.3) {
      return {
        type: 'OVERDUE',
        message: `${overdueCount} tasks are overdue (${Math.round((overdueCount / total) * 100)}%). Team capacity may be at risk.`,
        severity: 'HIGH',
      };
    }

    if (reviewRatio > 0.3) {
      return {
        type: 'IN_REVIEW',
        message: 'High concentration of tasks in Review. Code quality or testing might be slow.',
        severity: 'MEDIUM',
      };
    }

    return null;
  }
}
