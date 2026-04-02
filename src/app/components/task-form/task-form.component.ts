import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Task, Priority, Category } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnChanges {
  @Input() editTask: Task | null = null;
  @Output() formClose = new EventEmitter<void>();

  taskService = inject(TaskService);

  title = '';
  description = '';
  priority: Priority = 'medium';
  category: Category = 'work';
  dueDate = '';
  tagInput = '';
  tags: string[] = [];
  detectedPriority: Priority | null = null;
  isSubmitting = false;

  priorities: { value: Priority; label: string; icon: string; color: string }[] = [
    { value: 'urgent', label: 'Urgent', icon: 'local_fire_department', color: '#ff4444' },
    { value: 'high', label: 'High', icon: 'arrow_upward', color: '#ff8800' },
    { value: 'medium', label: 'Medium', icon: 'remove', color: '#ffcc00' },
    { value: 'low', label: 'Low', icon: 'arrow_downward', color: '#44cc88' },
  ];

  categories: { value: Category; label: string; icon: string }[] = [
    { value: 'work', label: 'Work', icon: 'work' },
    { value: 'personal', label: 'Personal', icon: 'person' },
    { value: 'health', label: 'Health', icon: 'favorite' },
    { value: 'learning', label: 'Learning', icon: 'school' },
    { value: 'finance', label: 'Finance', icon: 'account_balance_wallet' },
    { value: 'other', label: 'Other', icon: 'category' },
  ];

  ngOnChanges(): void {
    if (this.editTask) {
      this.title = this.editTask.title;
      this.description = this.editTask.description;
      this.priority = this.editTask.priority;
      this.category = this.editTask.category;
      this.dueDate = this.editTask.dueDate;
      this.tags = [...this.editTask.tags];
      this.detectedPriority = null;
    }
  }

  onTitleChange(): void {
    if (this.title.length > 3) {
      const detected = this.taskService.detectPriority(this.title);
      const detectedCat = this.taskService.detectCategory(this.title);
      if (detected !== this.priority) {
        this.detectedPriority = detected;
      } else {
        this.detectedPriority = null;
      }
      this.category = detectedCat;
    }
  }

  applyDetectedPriority(): void {
    if (this.detectedPriority) {
      this.priority = this.detectedPriority;
      this.detectedPriority = null;
    }
  }

  addTag(): void {
    const tag = this.tagInput.trim().toLowerCase();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  submit(): void {
    if (!this.title.trim()) return;
    this.isSubmitting = true;

    const taskData = {
      title: this.title.trim(),
      description: this.description.trim(),
      priority: this.priority,
      category: this.category,
      dueDate: this.dueDate,
      completed: false,
      tags: this.tags,
    };

    setTimeout(() => {
      if (this.editTask) {
        this.taskService.updateTask(this.editTask.id, taskData);
      } else {
        this.taskService.addTask(taskData);
      }
      this.isSubmitting = false;
      this.reset();
      this.formClose.emit();
    }, 400);
  }

  reset(): void {
    this.title = '';
    this.description = '';
    this.priority = 'medium';
    this.category = 'work';
    this.dueDate = '';
    this.tags = [];
    this.tagInput = '';
    this.detectedPriority = null;
  }

  close(): void {
    this.reset();
    this.formClose.emit();
  }
}
