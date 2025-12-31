
export interface UserProfile {
  name: string;
  mobile: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string; // ISO format
  description: string;
}

export interface WeeklyData {
  day: string;
  amount: number;
}

export interface MonthlySummary {
  month: string;
  total: number;
  savings: number;
}

export interface AppSettings {
  weeklyLimit: number;
  phoneNumber: string;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  HISTORY = 'history',
  SCANNER = 'scanner',
  EDITOR = 'editor',
  SETTINGS = 'settings'
}
