import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../types';
import { App } from '../App';

const state = vi.hoisted(() => ({
  user: null as User | null,
  loading: false,
  error: '',
  retry: vi.fn(),
  logout: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => state,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/api')>();
  return { ...actual, userApi: { list: vi.fn() } };
});
describe('route access', () => {
  it('keeps the home page public when the API is unavailable', () => {
    state.user = null;
    state.error = 'The API is unavailable.';
    window.history.replaceState({}, '', '/');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Every request/ }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('link', { name: /Get started/i })[0],
    ).toHaveAttribute('href', '/register');
    expect(window.location.pathname).toBe('/');
    state.error = '';
  });
  it('protects the new dashboard route and preserves the return destination', async () => {
    state.user = null;
    state.error = '';
    window.history.replaceState({}, '', '/dashboard');
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Welcome back.' }),
    ).toBeVisible();
    expect(window.location.pathname).toBe('/login');
    expect(window.history.state.usr.from).toBe('/dashboard');
  });
  it('redirects anonymous visitors to sign in', async () => {
    state.user = null;
    window.history.replaceState({}, '', '/requests');
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Welcome back.' }),
    ).toBeVisible();
    expect(window.location.pathname).toBe('/login');
  });
  it('rejects member access to administrator pages', async () => {
    state.user = {
      id: 'user-1',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      role: 'USER',
      createdAt: '2026-10-01T00:00:00Z',
    };
    window.history.replaceState({}, '', '/users');
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Administrator access is required',
    );
    expect(
      screen.queryByRole('heading', { name: 'User management' }),
    ).not.toBeInTheDocument();
  });
  it('provides a useful 404 page', () => {
    window.history.replaceState({}, '', '/not-a-real-page');
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'A little off track.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Back to overview' }),
    ).toHaveAttribute('href', '/dashboard');
  });
});
