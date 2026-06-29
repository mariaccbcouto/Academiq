export interface Subject {
  id: string;
  name: string;
  colorClass: string;
  hexBg: string;
  hexBorder: string;
  hexText: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  priority: 'low' | 'medium' | 'high';
  poms: number;
  completed?: boolean;
  subtitle?: string;
}

export interface CalendarBlock {
  id: string;
  subjectId: string;
  title: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  room?: string;
}

export interface Grade {
  id: string;
  subjectId: string;
  name: string;
  value: number; // 0 to 20
  weight: number; // 1 to 100
  date: string; // YYYY-MM-DD
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  body: string;
  date: string;
  aiSummary?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  photoUrl: string;
  isLoggedIn: boolean;
}

export type TabType = 'dashboard' | 'upload' | 'grades' | 'notes' | 'profile';
