export enum AppStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  LOCKED = 'LOCKED',
}

export interface AppState {
  status: AppStatus;
  endTime: number | null; // Timestamp in milliseconds
  password: string;
  widgetPosition: { x: number; y: number };
}

export interface TimeConfig {
  hours: number;
  minutes: number;
}
