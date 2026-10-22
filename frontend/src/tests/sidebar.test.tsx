import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from '../layouts/AppLayout';

const auth = vi.hoisted(() => ({
  user: { name: 'Alex Morgan', role: 'USER' as 'USER' | 'ADMIN' },
  logout: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }));
function mount(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<h1>Workspace dashboard</h1>} />
          <Route path="requests/new" element={<h1>New request form</h1>} />
        </Route>
        <Route path="/" element={<h1>Public home</h1>} />
        <Route path="/login" element={<h1>Sign in page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  localStorage.clear();
  auth.user.role = 'USER';
});
describe('workspace sidebar', () => {
  it('persists the collapsed mode while keeping navigation links named', async () => {
    const user = userEvent.setup();
    const view = mount();
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(localStorage.getItem('servicenova.sidebar.collapsed')).toBe('true');
    expect(screen.getByRole('link', { name: 'My requests' })).toHaveAttribute(
      'href',
      '/requests',
    );
    view.unmount();
    mount();
    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(localStorage.getItem('servicenova.sidebar.collapsed')).toBe('false');
  });
  it('shows administrator tools only for administrators', () => {
    auth.user.role = 'ADMIN';
    mount();
    expect(
      screen.getByRole('link', { name: 'User management' }),
    ).toHaveAttribute('href', '/users');
    expect(
      screen.getByRole('link', { name: 'Manage requests' }),
    ).toHaveAttribute('href', '/requests');
    expect(
      screen.queryByRole('link', { name: 'Create request' }),
    ).not.toBeInTheDocument();
  });
  it('marks creation separately from the request list', () => {
    mount('/requests/new');
    expect(
      screen.getByRole('link', { name: 'Create request' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'My requests' }),
    ).not.toHaveAttribute('aria-current', 'page');
    expect(
      screen.queryByRole('link', { name: 'User management' }),
    ).not.toBeInTheDocument();
  });
  it('opens the drawer, locks the background and closes with Escape', async () => {
    const user = userEvent.setup();
    mount();
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(trigger);
    expect(
      screen.getByRole('dialog', { name: 'Workspace sidebar' }),
    ).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    expect(
      screen.getByRole('button', { name: 'Close navigation' }),
    ).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
  });
  it('returns to public home without signing out', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('link', { name: 'Home' }));
    expect(screen.getByRole('heading', { name: 'Public home' })).toBeVisible();
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
