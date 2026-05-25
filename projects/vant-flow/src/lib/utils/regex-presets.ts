export type VfRegexPresetKind = 'email' | 'url' | 'phone' | 'slug' | 'alphanumeric';

export interface VfRegexPresetOption {
  label: string;
  kind: VfRegexPresetKind;
  pattern: string;
  aliases: string[];
}

export const VF_REGEX_PRESET_OPTIONS: VfRegexPresetOption[] = [
  {
    label: 'Email',
    kind: 'email',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    aliases: ['email', 'e-mail', 'mail']
  },
  {
    label: 'Url',
    kind: 'url',
    pattern: '^(https?:\\/\\/)?(([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}|localhost)(:\\d+)?(\\/[^\\s]*)?$',
    aliases: ['url', 'uri', 'link', 'website', 'web']
  },
  {
    label: 'Phone',
    kind: 'phone',
    pattern: '^\\+?[0-9()\\-\\s]{7,20}$',
    aliases: ['phone', 'telephone', 'mobile', 'tel']
  },
  {
    label: 'Slug',
    kind: 'slug',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    aliases: ['slug']
  },
  {
    label: 'Alphanumeric',
    kind: 'alphanumeric',
    pattern: '^[a-zA-Z0-9]+$',
    aliases: ['alphanumeric', 'alpha-numeric', 'letters-numbers']
  }
];

const PRESET_LOOKUP = new Map(
  VF_REGEX_PRESET_OPTIONS.flatMap(option =>
    option.aliases.map(alias => [alias, option] as const)
  )
);

export function getRegexPresetOption(value?: string | null): VfRegexPresetOption | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return PRESET_LOOKUP.get(normalized) ?? null;
}

export function resolveRegexPattern(value?: string | null): string | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return undefined;
  }

  return getRegexPresetOption(raw)?.pattern ?? raw;
}
