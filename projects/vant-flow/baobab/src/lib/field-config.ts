/**
 * Storage hints a Baobab form field may carry under its `baobab` key. Baobab's server decides
 * the final storage; these record what the form author asked for.
 */
export interface VfBaobabFieldConfig {
  index?: boolean;
  unique?: boolean;
  virtual?: boolean;
}

declare module 'vant-flow' {
  interface DocumentField {
    baobab?: VfBaobabFieldConfig;
  }

  interface TableColumnDef {
    baobab?: VfBaobabFieldConfig;
  }
}
