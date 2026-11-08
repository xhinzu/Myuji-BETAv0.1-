export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: string;
  message: string;
}

const MAX_LOGS = 200;

class AppLogger {
  private static instance: AppLogger;
  private logs: LogEntry[] = [];

  private constructor() {
    this.log('INFO', 'System', 'MyuJiku v2 logger initialized');
  }

  public static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  public log(level: LogEntry['level'], category: string, message: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      category,
      message,
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }

    if (level === 'ERROR') {
      console.error(`[${entry.category}] ${entry.message}`);
    } else if (level === 'WARN') {
      console.warn(`[${entry.category}] ${entry.message}`);
    } else {
      console.log(`[${entry.category}] ${entry.message}`);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
  }
}

export const Logger = AppLogger.getInstance();
