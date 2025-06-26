
type LogLevel = 'info' | 'error' | 'debug' | 'warn';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private enableDebug = this.isDevelopment || import.meta.env.VITE_DEBUG === 'true';

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, data?: LogData): void {
    const formattedMessage = this.formatMessage(level, message, data);
    
    switch (level) {
      case 'error':
        console.error(formattedMessage, data || '');
        // Em produção, aqui você enviaria para um serviço de logging
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'info':
        console.log(formattedMessage, data || '');
        break;
      case 'debug':
        if (this.enableDebug) {
          console.log(formattedMessage, data || '');
        }
        break;
    }
  }

  info(message: string, data?: LogData): void {
    this.log('info', message, data);
  }

  error(message: string, error?: Error | LogData): void {
    this.log('error', message, error);
  }

  warn(message: string, data?: LogData): void {
    this.log('warn', message, data);
  }

  debug(message: string, data?: LogData): void {
    this.log('debug', message, data);
  }

  // Métodos específicos para operações comuns
  apiCall(endpoint: string, method: string, data?: LogData): void {
    this.debug(`API Call: ${method} ${endpoint}`, data);
  }

  apiResponse(endpoint: string, status: number, data?: LogData): void {
    if (status >= 400) {
      this.error(`API Error: ${endpoint} returned ${status}`, data);
    } else {
      this.debug(`API Success: ${endpoint} returned ${status}`, data);
    }
  }

  userAction(action: string, data?: LogData): void {
    this.info(`User Action: ${action}`, data);
  }

  performance(operation: string, duration: number, data?: LogData): void {
    this.debug(`Performance: ${operation} took ${duration}ms`, data);
  }
}

export const logger = new Logger();
