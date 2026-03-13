export type FieldType = 'Data' | 'Select' | 'Link' | 'Check' | 'Int' | 'Text' | 'Date' | 'Float' | 'Password';

export interface DocumentField {
  id: string; // Unique ID for drag-drop tracking
  fieldname: string;
  fieldtype: FieldType;
  label: string;
  default?: any;
  mandatory?: boolean;
  reqd?: boolean;
  options?: string; // Newline-separated for Select, Document name for Link
  hidden?: boolean;
  read_only?: boolean;
  depends_on?: string; // Visible if expression is truthy
  mandatory_depends_on?: string; // Mandatory if expression is truthy
  description?: string;
  placeholder?: string;
}

export interface DocumentColumn {
  id: string;
  fields: DocumentField[];
}

export interface DocumentSection {
  id: string;
  label?: string;
  description?: string;
  depends_on?: string; // Evaluate expression to show/hide section
  hidden?: boolean; // New: for scripting API control
  collapsible?: boolean;
  columns_count?: 1 | 2;
  columns: DocumentColumn[];
}

export interface DocumentDefinition {
  name: string;
  module?: string;
  description?: string;
  version?: string;
  intro_text?: string;
  intro_color?: 'blue' | 'orange' | 'red' | 'gray';
  sections: DocumentSection[];
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
