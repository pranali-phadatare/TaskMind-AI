import { Injectable, signal, computed } from '@angular/core';
import { Task, Priority, SmartSuggestion, Category } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly STORAGE_KEY = 'smart_tasks';

  tasks = signal<Task[]>(this.loadTasks());

  pendingTasks = computed(() => this.tasks().filter(t => !t.completed));
  completedTasks = computed(() => this.tasks().filter(t => t.completed));
  urgentTasks = computed(() => this.tasks().filter(t => t.priority === 'urgent' && !t.completed));

  private loadTasks(): Task[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : this.getSampleTasks();
  }

  private saveTasks(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks()));
  }

  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...this.generateSmartSuggestion(task.title, task.priority, task.category)
    };
    this.tasks.update(tasks => [newTask, ...tasks]);
    this.saveTasks();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): void {
    this.tasks.update(tasks =>
      tasks.map(t => t.id === id ? {
        ...t, ...updates,
        ...this.generateSmartSuggestion(
          updates.title ?? t.title,
          updates.priority ?? t.priority,
          updates.category ?? t.category
        )
      } : t)
    );
    this.saveTasks();
  }

  deleteTask(id: string): void {
    this.tasks.update(tasks => tasks.filter(t => t.id !== id));
    this.saveTasks();
  }

  toggleComplete(id: string): void {
    this.tasks.update(tasks =>
      tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
    this.saveTasks();
  }

  detectPriority(title: string): Priority {
    const text = title.toLowerCase();
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately', 'deadline', 'due today', 'overdue'];
    const highKeywords = ['important', 'meeting', 'presentation', 'submit', 'report', 'exam', 'interview', 'launch'];
    const lowKeywords = ['someday', 'maybe', 'later', 'whenever', 'leisure', 'optional', 'consider'];

    if (urgentKeywords.some(k => text.includes(k))) return 'urgent';
    if (highKeywords.some(k => text.includes(k))) return 'high';
    if (lowKeywords.some(k => text.includes(k))) return 'low';
    return 'medium';
  }

  detectCategory(title: string): Category {
    const text = title.toLowerCase();
    const map: { keywords: string[]; cat: Category }[] = [
      { keywords: ['meeting', 'report', 'client', 'project', 'email', 'call', 'office', 'work', 'boss', 'deadline', 'presentation', 'submit'], cat: 'work' },
      { keywords: ['gym', 'workout', 'exercise', 'run', 'yoga', 'meditate', 'doctor', 'health', 'diet', 'sleep'], cat: 'health' },
      { keywords: ['study', 'learn', 'course', 'book', 'read', 'tutorial', 'class', 'skill', 'practice'], cat: 'learning' },
      { keywords: ['bill', 'pay', 'bank', 'budget', 'invest', 'tax', 'money', 'finance', 'salary'], cat: 'finance' },
      { keywords: ['family', 'friend', 'party', 'shop', 'clean', 'cook', 'travel', 'holiday', 'vacation'], cat: 'personal' },
    ];
    const match = map.find(m => m.keywords.some(k => text.includes(k)));
    return match?.cat ?? 'other';
  }

  generateSmartSuggestion(title: string, priority: Priority, category: Category): Pick<Task, 'bestTime' | 'aiSuggestion'> {
    const suggestion = this.getSmartSuggestion(title, priority, category);
    return {
      bestTime: suggestion.bestTime,
      aiSuggestion: `${suggestion.tip} | Energy: ${suggestion.energy} | ${suggestion.reason}`
    };
  }

  getSmartSuggestion(title: string, priority: Priority, category: Category): SmartSuggestion {
    const text = title.toLowerCase();

    // Category-based time suggestions
    const categoryTimes: Record<Category, { time: string; reason: string; energy: 'high' | 'medium' | 'low'; tip: string }> = {
      work: { time: '9:00 AM - 11:00 AM', reason: 'Peak focus hours for cognitive tasks', energy: 'high', tip: 'Block distractions and work in 25-min sprints' },
      health: { time: '6:00 AM - 8:00 AM', reason: 'Morning routines boost metabolism & mood', energy: 'high', tip: 'Consistency beats intensity — just start!' },
      learning: { time: '7:00 PM - 9:00 PM', reason: 'Evening consolidates memory during sleep', energy: 'medium', tip: 'Use active recall, not passive reading' },
      finance: { time: '10:00 AM - 12:00 PM', reason: 'Clear mind for numbers and decisions', energy: 'high', tip: 'Review all docs before making decisions' },
      personal: { time: '12:00 PM - 2:00 PM', reason: 'Midday break is perfect for errands', energy: 'medium', tip: 'Batch similar tasks to save time' },
      other: { time: '3:00 PM - 5:00 PM', reason: 'Afternoon is great for flexible tasks', energy: 'medium', tip: 'Group small tasks together for efficiency' },
    };

    const base = categoryTimes[category];

    // Priority overrides
    if (priority === 'urgent') {
      return { bestTime: 'Do it NOW!', reason: 'This task is urgent — immediate action needed', energy: 'high', tip: 'Drop everything else and focus on this first' };
    }
    if (priority === 'low') {
      return { bestTime: '4:00 PM - 6:00 PM', reason: 'Low-energy afternoon window is perfect', energy: 'low', tip: 'Batch with other small tasks or delegate if possible' };
    }

    // Keyword overrides
    if (text.includes('email') || text.includes('reply')) {
      return { bestTime: '9:00 AM or 4:00 PM', reason: 'Process emails in batches, not continuously', energy: 'low', tip: 'Turn off email notifications for deep work' };
    }
    if (text.includes('meeting') || text.includes('call')) {
      return { bestTime: '10:00 AM - 12:00 PM', reason: 'People are most alert mid-morning', energy: 'high', tip: 'Send agenda beforehand for productive meetings' };
    }
    if (text.includes('exercise') || text.includes('gym') || text.includes('run')) {
      return { bestTime: '6:00 AM - 7:30 AM', reason: 'Morning exercise boosts energy all day', energy: 'high', tip: 'Prepare clothes the night before to reduce friction' };
    }
    if (text.includes('read') || text.includes('study')) {
      return { bestTime: '8:00 PM - 10:00 PM', reason: 'Sleep after learning consolidates memory', energy: 'medium', tip: 'Use Pomodoro: 25 min read, 5 min break' };
    }
    if (text.includes('creative') || text.includes('design') || text.includes('write')) {
      return { bestTime: '9:00 AM - 11:00 AM', reason: 'Creative flow peaks in late morning', energy: 'high', tip: 'Skip social media before creative sessions' };
    }

    return { bestTime: base.time, reason: base.reason, energy: base.energy, tip: base.tip };
  }

  private getSampleTasks(): Task[] {
    const samples = [
      { title: 'Submit project report', description: 'Finalize Q1 analysis and send to manager', priority: 'urgent' as Priority, category: 'work' as Category, dueDate: new Date().toISOString().split('T')[0], tags: ['work', 'report'] },
      { title: 'Morning workout & yoga', description: '30 min cardio + 15 min yoga session', priority: 'high' as Priority, category: 'health' as Category, dueDate: new Date().toISOString().split('T')[0], tags: ['fitness', 'routine'] },
      { title: 'Study Angular signals', description: 'Complete the advanced signals tutorial', priority: 'medium' as Priority, category: 'learning' as Category, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], tags: ['coding', 'angular'] },
      { title: 'Pay electricity bill', description: 'Due by end of month', priority: 'high' as Priority, category: 'finance' as Category, dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], tags: ['bills'] },
      { title: 'Read design book', description: 'Chapter 5-8 of "Refactoring UI"', priority: 'low' as Priority, category: 'learning' as Category, dueDate: new Date(Date.now() + 604800000).toISOString().split('T')[0], tags: ['design', 'reading'] },
    ];
    return samples.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: false,
      ...this.generateSmartSuggestion(s.title, s.priority, s.category)
    }));
  }
}
