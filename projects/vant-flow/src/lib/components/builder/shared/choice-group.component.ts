import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface VfChoiceOption<T = string> {
  value: T;
  label: string;
  description?: string;
}

@Component({
  selector: 'vf-choice-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="grid gap-1.5"
      [style.grid-template-columns]="'repeat(' + columns + ', minmax(0, 1fr))'">
      @for (option of options; track option.value) {
        <button
          type="button"
          (click)="select(option.value)"
          class="rounded-lg border text-left transition-all duration-200"
          [ngClass]="getOptionClass(option.value)">
          <span class="block font-semibold capitalize" [ngClass]="size === 'sm' ? 'text-[10px]' : 'text-xs'">
            {{ option.label }}
          </span>
          @if (option.description && size !== 'sm') {
            <span class="mt-1 block text-[10px] leading-snug text-zinc-400">
              {{ option.description }}
            </span>
          }
        </button>
      }
    </div>
  `,
})
export class VfChoiceGroup<T = string> {
  @Input() options: Array<VfChoiceOption<T>> = [];
  @Input() selected!: T;
  @Input() columns = 2;
  @Input() size: 'sm' | 'md' = 'md';
  @Output() selectedChange = new EventEmitter<T>();

  select(value: T) {
    this.selectedChange.emit(value);
  }

  getOptionClass(value: T) {
    const basePadding = this.size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2';
    const selected = this.selected === value;

    return [
      basePadding,
      selected
        ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm'
        : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
    ].join(' ');
  }
}

