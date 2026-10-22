export const categories = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'OTHER'] as const;
export const priorities = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const statuses = [
  'PENDING',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED',
] as const;
export type Status = (typeof statuses)[number];
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt?: string;
  _count?: { requests: number };
}
export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: (typeof categories)[number];
  priority: (typeof priorities)[number];
  status: Status;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}
export interface PageResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
export interface Metrics {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  totalUsers?: number;
}
export const transitions: Record<Status, Status[]> = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED: [],
  CANCELLED: [],
};

export interface RequestActivity {
  id: number;
  type: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'TRACKING_STARTED';
  actor: { id: string; name: string } | null;
  fromStatus: Status | null;
  toStatus: Status | null;
  changedFields: string | null;
  createdAt: string;
}
