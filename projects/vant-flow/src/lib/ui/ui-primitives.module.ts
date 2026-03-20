import { Directive, HostBinding, Input, NgModule } from '@angular/core';

const BTN_BASE = 'inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';
const BTN_PRIMARY = 'px-5 py-2.5 bg-indigo-600 text-white text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95';
const BTN_SECONDARY = 'px-5 py-2.5 bg-white border border-zinc-200 text-zinc-600 text-sm hover:bg-zinc-50 active:scale-95';
const BTN_GHOST = 'px-4 py-2.5 bg-transparent border border-zinc-200 text-zinc-500 text-sm hover:bg-zinc-50 hover:text-zinc-700 active:scale-95';
const BTN_DESTRUCTIVE = 'px-5 py-2.5 bg-red-600 text-white text-sm hover:bg-red-700 shadow-lg shadow-red-100 active:scale-95';
const BTN_SM = 'px-3 py-1.5 rounded-lg text-[11px] font-semibold';

const INPUT_BASE = 'w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2.5 text-[13px] text-zinc-700 outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60';
const TEXTAREA_BASE = `${INPUT_BASE} min-h-[84px] resize-y`;
const SELECT_BASE = `${INPUT_BASE} appearance-none`;

const LABEL_BASE = 'block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-1.5';
const SEP_BASE = 'h-px w-full bg-zinc-100';
const BADGE_INDIGO = 'inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600';
const SWITCH_BASE = 'relative inline-flex h-5 w-9 items-center rounded-full bg-zinc-200 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 aria-[checked=true]:bg-indigo-600';
const SWITCH_THUMB_BASE = 'inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200';

@Directive({
  selector: 'button.ui-btn-primary, a.ui-btn-primary',
  standalone: true,
})
export class VfUiBtnPrimaryDirective {
  @HostBinding('class') readonly className = `${BTN_BASE} ${BTN_PRIMARY}`;
}

@Directive({
  selector: 'button.ui-btn-secondary, a.ui-btn-secondary',
  standalone: true,
})
export class VfUiBtnSecondaryDirective {
  @HostBinding('class') readonly className = `${BTN_BASE} ${BTN_SECONDARY}`;
}

@Directive({
  selector: 'button.ui-btn-ghost, a.ui-btn-ghost',
  standalone: true,
})
export class VfUiBtnGhostDirective {
  @HostBinding('class') readonly className = `${BTN_BASE} ${BTN_GHOST}`;
}

@Directive({
  selector: 'button.ui-btn-destructive, a.ui-btn-destructive',
  standalone: true,
})
export class VfUiBtnDestructiveDirective {
  @HostBinding('class') readonly className = `${BTN_BASE} ${BTN_DESTRUCTIVE}`;
}

@Directive({
  selector: 'button.ui-btn-sm, a.ui-btn-sm',
  standalone: true,
})
export class VfUiBtnSmallDirective {
  @HostBinding('class') readonly className = BTN_SM;
}

@Directive({
  selector: 'input.ui-input',
  standalone: true,
})
export class VfUiInputDirective {
  @HostBinding('class') readonly className = INPUT_BASE;
}

@Directive({
  selector: 'textarea.ui-textarea',
  standalone: true,
})
export class VfUiTextareaDirective {
  @HostBinding('class') readonly className = TEXTAREA_BASE;
}

@Directive({
  selector: 'select.ui-select',
  standalone: true,
})
export class VfUiSelectDirective {
  @HostBinding('class') readonly className = SELECT_BASE;
}

@Directive({
  selector: 'label.ui-label',
  standalone: true,
})
export class VfUiLabelDirective {
  @HostBinding('class') readonly className = LABEL_BASE;
}

@Directive({
  selector: 'div.ui-sep',
  standalone: true,
})
export class VfUiSeparatorDirective {
  @HostBinding('class') readonly className = SEP_BASE;
}

@Directive({
  selector: 'span.ui-badge-indigo',
  standalone: true,
})
export class VfUiBadgeIndigoDirective {
  @HostBinding('class') readonly className = BADGE_INDIGO;
}

@Directive({
  selector: 'button.ui-switch',
  standalone: true,
})
export class VfUiSwitchDirective {
  @HostBinding('class') readonly className = SWITCH_BASE;
}

@Directive({
  selector: 'span.ui-switch-thumb',
  standalone: true,
})
export class VfUiSwitchThumbDirective {
  @HostBinding('class') readonly className = SWITCH_THUMB_BASE;
}

@Directive({
  selector: 'button[vfButton], a[vfButton]',
  standalone: true,
})
export class VfButtonDirective {
  @Input('vfButton') variant: 'primary' | 'secondary' | 'ghost' | 'destructive' = 'primary';
  @Input() vfButtonSize: 'md' | 'sm' = 'md';

  @HostBinding('class')
  get className() {
    const variantClass = {
      primary: BTN_PRIMARY,
      secondary: BTN_SECONDARY,
      ghost: BTN_GHOST,
      destructive: BTN_DESTRUCTIVE,
    }[this.variant];

    return [BTN_BASE, variantClass, this.vfButtonSize === 'sm' ? BTN_SM : ''].join(' ').trim();
  }
}

@Directive({
  selector: 'input[vfInput]',
  standalone: true,
})
export class VfInputPrimitiveDirective {
  @HostBinding('class') readonly className = INPUT_BASE;
}

@Directive({
  selector: 'textarea[vfTextarea]',
  standalone: true,
})
export class VfTextareaPrimitiveDirective {
  @HostBinding('class') readonly className = TEXTAREA_BASE;
}

@Directive({
  selector: 'select[vfSelect]',
  standalone: true,
})
export class VfSelectPrimitiveDirective {
  @HostBinding('class') readonly className = SELECT_BASE;
}

const VF_UI_DIRECTIVES = [
  VfUiBtnPrimaryDirective,
  VfUiBtnSecondaryDirective,
  VfUiBtnGhostDirective,
  VfUiBtnDestructiveDirective,
  VfUiBtnSmallDirective,
  VfUiInputDirective,
  VfUiTextareaDirective,
  VfUiSelectDirective,
  VfUiLabelDirective,
  VfUiSeparatorDirective,
  VfUiBadgeIndigoDirective,
  VfUiSwitchDirective,
  VfUiSwitchThumbDirective,
  VfButtonDirective,
  VfInputPrimitiveDirective,
  VfTextareaPrimitiveDirective,
  VfSelectPrimitiveDirective,
];

@NgModule({
  imports: VF_UI_DIRECTIVES,
  exports: VF_UI_DIRECTIVES,
})
export class VfUiPrimitivesModule {}

