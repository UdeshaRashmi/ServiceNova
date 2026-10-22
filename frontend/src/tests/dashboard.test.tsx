import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';

const mocks = vi.hoisted(() => ({
  metrics: vi.fn(),
  list: vi.fn(),
  user: { name: 'Alex Morgan', role: 'USER' as 'USER' | 'ADMIN' },
}));
vi.mock('../services/api', () => ({
  requestApi: mocks,
  errorMessage: () => 'The API is unavailable.',
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

beforeEach(() => {
  mocks.user.role = 'USER';
});
describe('dashboard data', () => {
  it('does not offer member-only creation to admins with no requests', async () => {
    mocks.user.role = 'ADMIN';
    mocks.metrics.mockResolvedValue({
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      totalUsers: 1,
    });
    mocks.list.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, totalItems: 0, totalPages: 0 },
    });
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(await screen.findByText('No requests yet')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Manage requests' }),
    ).toHaveAttribute('href', '/requests');
    expect(
      screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href') === '/requests/new'),
    ).toHaveLength(0);
  });
  it('shows backend totals and an empty state for a new account', async () => {
    mocks.metrics.mockResolvedValue({
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
    });
    mocks.list.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, totalItems: 0, totalPages: 0 },
    });
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(await screen.findByText('No requests yet')).toBeVisible();
    expect(screen.getAllByText('0', { selector: 'strong' })).toHaveLength(4);
  });
  it('shows a retry state instead of invented totals when the API fails', async () => {
    mocks.metrics.mockRejectedValue(new Error('offline'));
    mocks.list.mockResolvedValue({ data: [] });
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The API is unavailable.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
    expect(
      screen.queryByLabelText('Request statistics'),
    ).not.toBeInTheDocument();
  });
});
