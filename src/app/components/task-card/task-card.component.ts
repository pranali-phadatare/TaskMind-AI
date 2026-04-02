import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss'
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Output() edit = new EventEmitter<Task>();

  taskService = inject(TaskService);
  showSuggestion = signal(false);
  showDeleteConfirm = signal(false);

  priorityConfig = {
    urgent: { icon: 'local_fire_department', color: '#ff4444', label: 'Urgent' },
    high: { icon: 'arrow_upward', color: '#ff8800', label: 'High' },
    medium: { icon: 'remove', color: '#ffcc00', label: 'Medium' },
    low: { icon: 'arrow_downward', color: '#44cc88', label: 'Low' },
  };

  categoryConfig = {
    work: { icon: 'work', color: '#6c63ff' },
    personal: { icon: 'person', color: '#ff6584' },
    health: { icon: 'favorite', color: '#2ecc71' },
    learning: { icon: 'school', color: '#3498db' },
    finance: { icon: 'account_balance_wallet', color: '#f39c12' },
    other: { icon: 'category', color: '#8888aa' },
  };

  get priorityInfo() { return this.priorityConfig[this.task.priority]; }
  get categoryInfo() { return this.categoryConfig[this.task.category]; }

  get isOverdue(): boolean {
    if (!this.task.dueDate || this.task.completed) return false;
    return new Date(this.task.dueDate) < new Date(new Date().toDateString());
  }

  get dueDateLabel(): string {
    if (!this.task.dueDate) return '';
    const due = new Date(this.task.dueDate);
    const today = new Date(new Date().toDateString());
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff}d left`;
  }

  get aiTip(): string {
    if (!this.task.aiSuggestion) return '';
    const parts = this.task.aiSuggestion.split(' | ');
    return parts[0] ?? '';
  }

  get aiReason(): string {
    if (!this.task.aiSuggestion) return '';
    const parts = this.task.aiSuggestion.split(' | ');
    return parts[2] ?? '';
  }

  toggleComplete(): void {
    this.taskService.toggleComplete(this.task.id);
  }

  onEdit(): void {
    this.edit.emit(this.task);
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  doDelete(): void {
    this.taskService.deleteTask(this.task.id);
  }

  toggleSuggestion(): void {
    this.showSuggestion.update(v => !v);
  }
}
