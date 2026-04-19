/**
 * Structured Logger
 * Replaces console.log with proper level-based logging and context.
 * In production, this could be extended to ship logs to a service like Sentry or Datadog.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error
      ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
      : { error };

    // eslint-disable-next-line no-console
    console.error(
      this.formatMessage('error', message, { ...context, ...errorDetails })
    );
  }
}

export const logger = new Logger();
export default logger;
