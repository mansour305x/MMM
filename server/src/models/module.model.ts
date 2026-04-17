export interface ModuleFeature {
  id: string;
  code: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
