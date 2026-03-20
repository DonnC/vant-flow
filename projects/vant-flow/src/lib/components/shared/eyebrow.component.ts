import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'vf-eyebrow',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
      [ngClass]="toneClass">
      {{ label }}
    </span>
  `,
})
export class VfEyebrow {
  @Input() label = '';
  @Input() tone: 'indigo' | 'amber' | 'sky' | 'neutral' = 'neutral';

  get toneClass() {
    const tones: Record<string, string> = {
      indigo: 'bg-indigo-50 text-indigo-600',
      amber: 'bg-amber-50 text-amber-600',
      sky: 'bg-sky-50 text-sky-700',
      neutral: 'bg-zinc-50 text-zinc-500',
    };

    return tones[this.tone] || tones['neutral'];
  }
}

