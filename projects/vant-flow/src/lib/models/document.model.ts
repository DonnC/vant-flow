export type FieldType = 'Data' | 'Select' | 'Link' | 'Check' | 'Int' | 'Text' | 'Date' | 'Float' | 'Password' | 'Button' | 'Text Editor' | 'Table' | 'Datetime' | 'Time' | 'Signature' | 'Attach';

/** Column definition for Table field child columns (no nested Table/Button/Text Editor) */
export interface TableColumnDef {
  id: string;
  fieldname: string;
  label: string;
  fieldtype: Exclude<FieldType, 'Table'>;
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

export interface DocumentStep {
  id: string;
  title: string;
  description?: string;
  sections: DocumentSection[];
}

export interface FormActionButton {
  label: string;
  visible: boolean;
  type?: string;
  action?: string; // Custom script event to trigger
  disable_on_readonly?: boolean;
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
  is_stepper?: boolean;
  intro_text?: string;
  intro_color?: 'blue' | 'orange' | 'red' | 'gray';
  sections: DocumentSection[]; // Sections for legacy/flat forms
  steps?: DocumentStep[]; // Steps for multi-step forms
  client_script?: string;
  actions?: FormActionsConfig;
}

// Palette items used by the left sidebar (not actual fields yet)
export interface PaletteItem {
  fieldtype: FieldType | 'Section Break' | 'Column Break';
  label: string;
  icon: string;
  desc?: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { fieldtype: 'Data', label: 'Data', icon: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7', desc: 'Single line text input' },
  { fieldtype: 'Select', label: 'Select', icon: 'M19 9l-7 7-7-7', desc: 'Dropdown list of options' },
  { fieldtype: 'Link', label: 'Link', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101', desc: 'Relational link to another doc' },
  { fieldtype: 'Check', label: 'Check', icon: 'M5 13l4 4L19 7', desc: 'Boolean toggle / checkbox' },
  { fieldtype: 'Int', label: 'Integer', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14', desc: 'Whole number input' },
  { fieldtype: 'Float', label: 'Float', icon: 'M9 15l3 3m0 0l3-3m-3 3V10m0 0l3 3m-3-3l-3 3', desc: 'Decimal number input' },
  { fieldtype: 'Text', label: 'Text', icon: 'M4 6h16M4 12h16M4 18h7', desc: 'Multi-line text area' },
  { fieldtype: 'Text Editor', label: 'Text Editor', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', desc: 'Rich text with formatting' },
  { fieldtype: 'Table', label: 'Table', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', desc: 'Grid of child records' },
  { fieldtype: 'Date', label: 'Date', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', desc: 'Calendar date picker' },
  { fieldtype: 'Datetime', label: 'Datetime', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Date and time selector' },
  { fieldtype: 'Time', label: 'Time', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Time selection only' },
  { fieldtype: 'Password', label: 'Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-11V7a4 4 0 10-8 0v4h8z', desc: 'Secure masked input' },
  { fieldtype: 'Button', label: 'Button', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Trigger for client scripts' },
  { fieldtype: 'Signature', label: 'Signature', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', desc: 'Digital signature pad' },
  { fieldtype: 'Attach', label: 'Attach', icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13', desc: 'File upload field' },
];
