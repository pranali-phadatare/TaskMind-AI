import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { Task, Priority, Category } from './models/task.model';

type FilterTab = 'all' | 'pending' | 'completed' | 'urgent';
type SortOption = 'created' | 'priority' | 'dueDate' | 'category';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskCardComponent, TaskFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  taskService = inject(TaskService);

  showForm = signal(false);
  editTask = signal<Task | null>(null);
  activeTab = signal<FilterTab>('all');
  searchQuery = signal('');
  sortBy = signal<SortOption>('created');
  filterPriority = signal<Priority | 'all'>('all');
  filterCategory = signal<Category | 'all'>('all');

  priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  filteredTasks = computed(() => {
    let tasks = this.taskService.tasks();

    // Tab filter
    switch (this.activeTab()) {
      case 'pending': tasks = tasks.filter(t => !t.completed); break;
      case 'completed': tasks = tasks.filter(t => t.completed); break;
      case 'urgent': tasks = tasks.filter(t => t.priority === 'urgent' && !t.completed); break;
    }

    // Search
    const q = this.searchQuery().toLowerCase();
    if (q) {
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q))
      );
    }

    // Priority filter
    if (this.filterPriority() !== 'all') {
      tasks = tasks.filter(t => t.priority === this.filterPriority());
    }

    // Category filter
    if (this.filterCategory() !== 'all') {
      tasks = tasks.filter(t => t.category === this.filterCategory());
    }

    // Sort
    return [...tasks].sort((a, b) => {
      switch (this.sortBy()) {
        case 'priority': return this.priorityOrder[a.priority] - this.priorityOrder[b.priority];
        case 'dueDate': {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        case 'category': return a.category.localeCompare(b.category);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  });

  stats = computed(() => {
    const all = this.taskService.tasks();
    const completed = all.filter(t => t.completed).length;
    return {
      total: all.length,
      completed,
      pending: all.filter(t => !t.completed).length,
      urgent: all.filter(t => t.priority === 'urgent' && !t.completed).length,
      completion: all.length ? Math.round((completed / all.length) * 100) : 0,
    };
  });

  tabs: { id: FilterTab; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: 'dashboard' },
    { id: 'pending', label: 'Pending', icon: 'pending_actions' },
    { id: 'urgent', label: 'Urgent', icon: 'local_fire_department' },
    { id: 'completed', label: 'Done', icon: 'task_alt' },
  ];

  priorities: { value: Priority | 'all'; label: string }[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  categories: { value: Category | 'all'; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'health', label: 'Health' },
    { value: 'learning', label: 'Learning' },
    { value: 'finance', label: 'Finance' },
    { value: 'other', label: 'Other' },
  ];

  openAdd(): void {
    this.editTask.set(null);
    this.showForm.set(true);
  }

  openEdit(task: Task): void {
    this.editTask.set(task);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editTask.set(null);
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  get timeEmoji(): string {
    const h = new Date().getHours();
    if (h < 12) return '☀️';
    if (h < 17) return '⚡';
    return '🌙';
  }
}
