export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Category = 'work' | 'personal' | 'health' | 'learning' | 'finance' | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  tags: string[];
  bestTime?: string;
  aiSuggestion?: string;
}

export interface SmartSuggestion {
  bestTime: string;
  reason: string;
  energy: 'high' | 'medium' | 'low';
  tip: string;
}
