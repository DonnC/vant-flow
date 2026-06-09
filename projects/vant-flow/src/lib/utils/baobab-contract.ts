import { DocumentDefinition, DocumentField, DocumentSection } from '../models/document.model';

export interface BaobabFieldContract {
  fieldname: string;
  fieldtype: string;
  options?: string;
  mandatory: boolean;
  default?: any;
  index: boolean;
  unique: boolean;
  virtual: boolean;
}

const VIRTUAL_BY_DEFAULT = new Set(['Table', 'JSONTable', 'Text Editor', 'Attach', 'Signature']);

export function extractBaobabContract(document: Pick<DocumentDefinition, 'sections' | 'steps' | 'is_stepper'>): BaobabFieldContract[] {
  const contract: BaobabFieldContract[] = [];
  const sections = getAllSections(document);

  const extractFields = (nodes: Array<{ fields?: DocumentField[]; columns?: any[] }> | undefined) => {
    if (!nodes) return;

    for (const node of nodes) {
      if (Array.isArray(node.fields)) {
        for (const field of node.fields) {
          contract.push(toContract(field));
        }
      }

      if (Array.isArray(node.columns)) {
        extractFields(node.columns);
      }
    }
  };

  extractFields(sections);
  return contract;
}

function getAllSections(document: Pick<DocumentDefinition, 'sections' | 'steps' | 'is_stepper'>): DocumentSection[] {
  if (document.is_stepper && document.steps) {
    return document.steps.flatMap(step => step.sections || []);
  }
  return document.sections || [];
}

function toContract(field: DocumentField): BaobabFieldContract {
  const index = field.baobab?.index ?? field.indexed ?? false;
  const unique = field.baobab?.unique ?? field.unique ?? false;
  const virtual = field.baobab?.virtual ?? field.virtual ?? VIRTUAL_BY_DEFAULT.has(field.fieldtype);

  return {
    fieldname: field.fieldname,
    fieldtype: field.fieldtype,
    options: field.options,
    mandatory: !!(field.mandatory ?? field.reqd),
    default: field.default,
    index: !!index,
    unique: !!unique,
    virtual: !!virtual
  };
}
