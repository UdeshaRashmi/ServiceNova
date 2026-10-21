export const categories = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'OTHER'] as const;
export const priorities = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const statuses = [
  'PENDING',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED',
] as const;
export type Status = (typeof statuses)[number];
export type Role = 'USER' | 'ADMIN';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
export type PublicUser = Omit<UserRecord, 'passwordHash' | 'sessionVersion'>;
export interface RequestInput {
  title: string;
  description: string;
  category: (typeof categories)[number];
  priority: (typeof priorities)[number];
}
export interface RequestRecord extends RequestInput {
  id: string;
  status: Status;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface RequestView extends RequestRecord {
  user: PublicUser;
}
export interface PageQuery {
  page: number;
  limit: number;
  search?: string;
}
export interface RequestQuery extends PageQuery {
  userId?: string;
  status?: Status;
  category?: RequestInput['category'];
  priority?: RequestInput['priority'];
  sort: 'newest' | 'oldest';
}
export interface Page<T> {
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

// Explicit allow-list: never serialize stored credentials or session versions.
export function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
export function pagination(page: number, limit: number, totalItems: number) {
  return { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) };
}
