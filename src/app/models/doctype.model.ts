export type FieldType = 'Data' | 'Select' | 'Link' | 'Check' | 'Int' | 'Text' | 'Date' | 'Float' | 'Password';

export interface DocField {
  id: string; // Unique ID for drag-drop tracking
  fieldname: string;
  fieldtype: FieldType;
  label: string;
  default?: any;
  mandatory?: boolean;
  reqd?: boolean;
  options?: string; // Newline-separated for Select, DocType name for Link
  hidden?: boolean;
  read_only?: boolean;
  depends_on?: string; // Visible if expression is truthy
  display_depends_on?: string; // Alternative display logic
  mandatory_depends_on?: string; // Mandatory if expression is truthy
  description?: string;
  placeholder?: string;
}

export interface LayoutColumn {
  id: string;
  fields: DocField[];
}

export interface LayoutSection {
  id: string;
  label?: string;
  collapsible?: boolean;
  columns: LayoutColumn[];
}

export interface DocType {
  name: string;
  module?: string;
  sections: LayoutSection[];
  client_script?: string;
}

// Palette items used by the left sidebar (not actual fields yet)
export interface PaletteItem {
  fieldtype: FieldType | 'Section Break' | 'Column Break';
  label: string;
  icon: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { fieldtype: 'Data', label: 'Data', icon: 'T' },
  { fieldtype: 'Int', label: 'Integer', icon: '#' },
  { fieldtype: 'Float', label: 'Float', icon: '0.0' },
  { fieldtype: 'Text', label: 'Text', icon: '¶' },
  { fieldtype: 'Select', label: 'Select', icon: '▾' },
  { fieldtype: 'Link', label: 'Link', icon: '⛓' },
  { fieldtype: 'Check', label: 'Check', icon: '✓' },
  { fieldtype: 'Date', label: 'Date', icon: '📅' },
  { fieldtype: 'Password', label: 'Password', icon: '🔒' },
];
