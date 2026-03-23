import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vf-icon-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [title]="title"
      [disabled]="disabled"
      (click)="pressed.emit($event)"
      class="inline-flex items-center justify-center transition-colors"
      [ngClass]="className">
      <ng-content></ng-content>
    </button>
  `,
})
export class VfIconButton {
  @Input() title = '';
  @Input() disabled = false;
  @Input() size: 'sm' | 'md' = 'sm';
  @Input() tone: 'neutral' | 'danger' | 'brand' = 'neutral';
  @Input() soft = false;
  @Output() pressed = new EventEmitter<Event>();

  get className() {
    const sizeClass = this.size === 'md' ? 'w-8 h-8 rounded-lg' : 'w-6 h-6 rounded';
    const toneClass = {
      neutral: this.soft
        ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
        : 'text-zinc-400 hover:text-zinc-600',
      danger: this.soft
        ? 'text-zinc-300 hover:text-red-500 hover:bg-red-50'
        : 'text-zinc-400 hover:text-red-500 hover:bg-red-50',
      brand: this.soft
        ? 'text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50'
        : 'text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50',
    }[this.tone];

    return [sizeClass, toneClass, 'disabled:opacity-50 disabled:cursor-not-allowed'].join(' ');
  }
}

