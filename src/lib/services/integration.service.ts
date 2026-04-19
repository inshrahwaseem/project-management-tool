/**
 * Integration Service — Handles external communications (Slack, Discord, GitHub).
 */

import logger from '@/lib/logger';

export class IntegrationService {
  /**
   * Send a notification to a Slack channel via Incoming Webhook.
   */
  static async notifySlack(webhookUrl: string, message: { title: string; text: string; color?: string }) {
    if (!webhookUrl) return;

    try {
      const payload = {
        attachments: [
          {
            title: message.title,
            text: message.text,
            color: message.color || '#6366f1',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Slack API responded with status ${res.status}`);
      }
    } catch (error) {
      logger.error('Failed to send Slack notification', error);
    }
  }

  /**
   * Parse GitHub commit messages for auto-closing commands.
   * Example: "feat: add login page (closes #task-123)"
   */
  static extractTaskId(commitMessage: string): string | null {
    const match = commitMessage.match(/(?:closes|fixes|resolves)\s+#[a-zA-Z0-9-]+/i);
    if (match) {
      return match[0].split('#')[1];
    }
    return null;
  }
}
