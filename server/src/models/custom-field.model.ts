export interface CustomField {
  id: string;
  fieldKey: string;
  label: string;
  type: 'text' | 'number' | 'phone' | 'email' | 'date' | 'select' | 'checkbox' | 'textarea' | 'url';
  required: boolean;
  uniqueValue: boolean;
  showInList: boolean;
  filterable: boolean;
  optionsJson: unknown;
  sortOrder: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFieldValue {
  id: string;
  clientId: string;
  fieldId: string;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  valueBool: boolean | null;
  createdAt: string;
  updatedAt: string;
}
