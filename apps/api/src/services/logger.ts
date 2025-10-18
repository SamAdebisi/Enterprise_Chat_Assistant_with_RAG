interface LogContext {
  requestId?: string;
  userId?: string;
  chatId?: string;
  operation?: string;
  duration?: number;
  error?: Error;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: LogContext;
}

class Logger {
  private formatLog(level: string, message: string, context?: LogContext): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level as LogEntry['level'],
      message,
      ...(context && { context })
    };
    return JSON.stringify(entry);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatLog('error', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  // Request logging helpers
  requestStart(method: string, url: string, requestId: string): void {
    this.info('Request started', { 
      requestId, 
      operation: 'request_start',
      method, 
      url 
    });
  }

  requestEnd(method: string, url: string, requestId: string, statusCode: number, duration: number): void {
    this.info('Request completed', { 
      requestId, 
      operation: 'request_end',
      method, 
      url, 
      statusCode, 
      duration 
    });
  }

  // Chat operation logging
  chatStart(userId: string, chatId: string, question: string): void {
    this.info('Chat query started', { 
      userId, 
      chatId, 
      operation: 'chat_start',
      questionLength: question.length 
    });
  }

  chatEnd(userId: string, chatId: string, success: boolean, duration: number, error?: Error): void {
    this.info('Chat query completed', { 
      userId, 
      chatId, 
      operation: 'chat_end',
      success, 
      duration,
      ...(error && { error }) 
    });
  }

  // Document operation logging
  documentUpload(userId: string, filename: string, roles: string[], chunks: number): void {
    this.info('Document uploaded and indexed', { 
      userId, 
      operation: 'document_upload',
      filename, 
      roles, 
      chunks 
    });
  }

  // Error logging with stack traces
  logError(error: Error, context?: LogContext): void {
    this.error('Application error', {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }
}

export const logger = new Logger();
export const log = logger.info.bind(logger); // Backward compatibility
