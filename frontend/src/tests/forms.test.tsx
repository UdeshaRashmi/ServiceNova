import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RequestForm } from '../components/RequestForm';
import { AuthPage } from '../pages/AuthPage';

const auth = vi.hoisted(() => ({
  user: null,
  login: vi.fn(),
  register: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }));

describe('request form', () => {
  it('rejects missing details before making an API submission', async () => {
    const submit = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RequestForm onSubmit={submit} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    expect(await screen.findByText('Use at least 5 characters.')).toBeVisible();
    expect(screen.getByText(/Add at least 20 characters/)).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });
  it('submits only the validated request fields', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RequestForm onSubmit={submit} />
      </MemoryRouter>,
    );
    await user.type(
      screen.getByLabelText(/request title/i),
      '  Unable to access billing  ',
    );
    await user.type(
      screen.getByLabelText(/^description/i),
      'The billing page fails to load when I open the invoices tab.',
    );
    await user.selectOptions(screen.getByLabelText(/^category/i), 'BILLING');
    await user.selectOptions(screen.getByLabelText(/^priority/i), 'HIGH');
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    expect(submit.mock.calls[0][0]).toEqual({
      title: 'Unable to access billing',
      description:
        'The billing page fails to load when I open the invoices tab.',
      category: 'BILLING',
      priority: 'HIGH',
    });
  });
});

describe('authentication forms', () => {
  it('requires valid credentials before sign in', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeVisible();
    expect(auth.login).not.toHaveBeenCalled();
  });
  it('shows API failures and supports password visibility', async () => {
    auth.login.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com');
    const password = screen.getByLabelText('Password');
    await user.type(password, 'test-password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
  });
  it('requires a display name when registering', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage register />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'test-password');
    await user.click(screen.getByRole('button', { name: /^create account$/i }));
    expect(await screen.findByText(/Enter your full name/)).toBeVisible();
    expect(auth.register).not.toHaveBeenCalled();
  });
});
