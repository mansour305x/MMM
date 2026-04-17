export interface Client {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string | null;
  region: string | null;
  status: 'active' | 'inactive' | 'vip' | 'new';
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
