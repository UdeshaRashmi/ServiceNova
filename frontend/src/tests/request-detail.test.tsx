import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestDetail } from '../pages/RequestDetail';
import type { ServiceRequest, User } from '../types';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  user: { id: 'user-1', name: 'Alex', role: 'USER' } as Pick<
    User,
    'id' | 'name' | 'role'
  >,
}));
vi.mock('../services/api', () => ({
  requestApi: { get: mocks.get },
  errorMessage: () => 'Could not load request.',
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
const request: ServiceRequest = {
  id: 'request-1',
  title: 'Cannot open billing',
  description: 'The billing screen does not open on my account.',
  category: 'BILLING',
  priority: 'HIGH',
  status: 'PENDING',
  userId: 'user-1',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
};
function mount() {
  render(
    <MemoryRouter initialEntries={['/requests/request-1']}>
      <Routes>
        <Route path="/requests/:id" element={<RequestDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  mocks.user.role = 'USER';
});
describe('request actions', () => {
  it('offers edit and cancel on a member’s own pending request', async () => {
    mocks.get.mockResolvedValue(request);
    mount();
    expect(
      await screen.findByRole('link', { name: /edit request/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /cancel request/i }),
    ).toBeVisible();
  });
  it('hides editing and cancellation after work begins', async () => {
    mocks.get.mockResolvedValue({ ...request, status: 'IN_PROGRESS' });
    mount();
    await screen.findByRole('heading', { name: request.title });
    expect(
      screen.queryByRole('link', { name: /edit request/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /cancel request/i }),
    ).not.toBeInTheDocument();
  });
  it('offers only allowed administrator transitions', async () => {
    mocks.user.role = 'ADMIN';
    mocks.get.mockResolvedValue({ ...request, status: 'IN_PROGRESS' });
    mount();
    expect(
      await screen.findByRole('button', { name: 'Mark as Resolved' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Mark as Cancelled' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Mark as Pending' }),
    ).not.toBeInTheDocument();
  });
  it('offers no status changes for terminal requests', async () => {
    mocks.user.role = 'ADMIN';
    mocks.get.mockResolvedValue({ ...request, status: 'RESOLVED' });
    mount();
    await screen.findByRole('heading', { name: request.title });
    expect(
      screen.queryByRole('button', { name: /mark as/i }),
    ).not.toBeInTheDocument();
  });
});
