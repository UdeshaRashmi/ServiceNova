import axios from 'axios';
import type {
  Metrics,
  RequestActivity,
  PageResult,
  ServiceRequest,
  Status,
  User,
} from '../types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/')
    )
      window.dispatchEvent(new Event('session-expired'));
    return Promise.reject(error);
  },
);
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error))
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      'Unable to reach ServiceNova. Please try again.'
    );
  return 'Something went wrong. Please try again.';
}
export const authApi = {
  me: async () => (await api.get<{ data: User }>('/auth/me')).data.data,
  login: async (values: { email: string; password: string }) =>
    (await api.post<{ data: User }>('/auth/login', values)).data.data,
  register: async (values: { name: string; email: string; password: string }) =>
    (await api.post<{ data: User }>('/auth/register', values)).data.data,
  logout: () => api.post('/auth/logout'),
};
export const requestApi = {
  history: async (id: string, page = 1) =>
    (
      await api.get<PageResult<RequestActivity>>(
        `/requests/${encodeURIComponent(id)}/history`,
        { params: { page, limit: 10 } },
      )
    ).data,
  list: async (params: Record<string, string | number> = {}) =>
    (await api.get<PageResult<ServiceRequest>>('/requests', { params })).data,
  metrics: async () =>
    (await api.get<{ data: Metrics }>('/requests/metrics')).data.data,
  get: async (id: string) =>
    (
      await api.get<{ data: ServiceRequest }>(
        `/requests/${encodeURIComponent(id)}`,
      )
    ).data.data,
  create: async (values: RequestInput) =>
    (await api.post<{ data: ServiceRequest }>('/requests', values)).data.data,
  update: async (id: string, values: RequestInput) =>
    (
      await api.patch<{ data: ServiceRequest }>(
        `/requests/${encodeURIComponent(id)}`,
        values,
      )
    ).data.data,
  cancel: (id: string) => api.delete(`/requests/${encodeURIComponent(id)}`),
  status: (id: string, status: Status) =>
    api.patch(`/requests/${encodeURIComponent(id)}/status`, { status }),
};
export type RequestInput = Pick<
  ServiceRequest,
  'title' | 'description' | 'category' | 'priority'
>;
export const userApi = {
  list: async (params: Record<string, string | number>) =>
    (await api.get<PageResult<User>>('/users', { params })).data,
  get: async (id: string) =>
    (await api.get<{ data: User }>(`/users/${encodeURIComponent(id)}`)).data
      .data,
  update: (id: string, values: { name: string }) =>
    api.patch(`/users/${encodeURIComponent(id)}`, values),
};
