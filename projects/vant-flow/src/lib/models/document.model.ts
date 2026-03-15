export type FieldType = 'Data' | 'Select' | 'Link' | 'Check' | 'Int' | 'Text' | 'Date' | 'Float' | 'Password' | 'Button' | 'Text Editor' | 'Table' | 'Datetime' | 'Time' | 'Signature' | 'Attach';

/** Column definition for Table field child columns (no nested Table/Button/Text Editor) */
export interface TableColumnDef {
  id: string;
  fieldname: string;
  label: string;
  fieldtype: 'Data' | 'Int' | 'Float' | 'Text' | 'Select' | 'Link' | 'Check' | 'Date' | 'Password';
  mandatory?: boolean;
  default?: any;
  options?: string;
  regex?: string;
}

export interface DocumentField {
  id: string; // Unique ID for drag-drop tracking
  fieldname: string;
  fieldtype: FieldType;
  label: string;
  default?: any;
  mandatory?: boolean;
  reqd?: boolean;
  options?: string; // Newline-separated for Select, Link target for Link, button style for Button, content for Markdown
  hidden?: boolean;
  read_only?: boolean;
  depends_on?: string; // Visible if expression is truthy
  mandatory_depends_on?: string; // Mandatory if expression is truthy
  description?: string;
  placeholder?: string;
  regex?: string; // Regex validator superpower
  table_fields?: TableColumnDef[]; // Only used by Table fieldtype
  data_group?: string; // Optional: nested object path (e.g. "user.profile")
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
  collapsed?: boolean;
  columns_count?: number;
  columns: DocumentColumn[];
}

export interface FormActionButton {
  label: string;
  visible: boolean;
  type?: string;
  action?: string; // Custom script event to trigger
}

export interface FormActionsConfig {
  save?: FormActionButton;
  submit?: FormActionButton;
  approve?: FormActionButton;
  decline?: FormActionButton;
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
  actions?: FormActionsConfig;
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
  { fieldtype: 'Button', label: 'Button', icon: '⬛' },
  { fieldtype: 'Text Editor', label: 'Text Editor', icon: '✎' },
  { fieldtype: 'Table', label: 'Table', icon: '⊞' },
  { fieldtype: 'Datetime', label: 'Datetime', icon: '📅' },
  { fieldtype: 'Time', label: 'Time', icon: '🕒' },
  { fieldtype: 'Signature', label: 'Signature', icon: '✍️' },
  { fieldtype: 'Attach', label: 'Attach', icon: '📎' },
];
