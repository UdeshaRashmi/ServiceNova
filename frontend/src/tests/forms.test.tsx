import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestForm } from '../components/RequestForm';
import { AuthPage, authSchema } from '../pages/AuthPage';

const auth = vi.hoisted(() => ({
  user: null,
  login: vi.fn(),
  register: vi.fn(),
}));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }));

beforeEach(() => {
  vi.resetAllMocks();
});

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
    expect(screen.getByRole('textbox', { name: /^Full name/ })).toHaveFocus();
    expect(auth.register).not.toHaveBeenCalled();
  });
});

describe('validation boundaries and feedback', () => {
  it('rejects whitespace-only request text without submission', async () => {
    const submit = vi.fn();
    render(
      <MemoryRouter>
        <RequestForm onSubmit={submit} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText(/Request title/), {
      target: { value: '      ' },
    });
    fireEvent.change(screen.getByLabelText(/^Description/), {
      target: { value: ' '.repeat(25) },
    });
    await userEvent.click(
      screen.getByRole('button', { name: /Submit request/ }),
    );
    expect(await screen.findByText('Use at least 5 characters.')).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });
  it('validates a touched request field before submitting', async () => {
    render(
      <MemoryRouter>
        <RequestForm onSubmit={vi.fn()} />
      </MemoryRouter>,
    );
    const input = screen.getByLabelText(/Request title/);
    await userEvent.click(input);
    await userEvent.tab();
    expect(await screen.findByText('Use at least 5 characters.')).toBeVisible();
    expect(input).toHaveAccessibleDescription('Use at least 5 characters.');
  });
  it('normalizes email before calling login', async () => {
    auth.login.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: '  ALEX@EXAMPLE.COM  ' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'test-password' },
    });
    await userEvent.click(screen.getByRole('button', { name: /^Sign in$/ }));
    await waitFor(() =>
      expect(auth.login).toHaveBeenCalledWith({
        email: 'alex@example.com',
        password: 'test-password',
      }),
    );
  });
  it('keeps registration rules and email/password upper bounds in the schema', () => {
    const valid = {
      name: 'Alex',
      email: 'alex@example.com',
      password: 'test-password',
    };
    expect(authSchema(true).safeParse({ ...valid, name: ' ' }).success).toBe(
      false,
    );
    expect(
      authSchema(true).safeParse({ ...valid, password: 'short' }).success,
    ).toBe(false);
    expect(
      authSchema(true).safeParse({
        ...valid,
        email: 'a'.repeat(255) + '@example.com',
      }).success,
    ).toBe(false);
    expect(
      authSchema(true).safeParse({ ...valid, password: 'x'.repeat(129) })
        .success,
    ).toBe(false);
    // Login passes nonempty credentials to the server rather than applying registration policy.
    expect(
      authSchema(false).safeParse({ email: valid.email, password: 'short' })
        .success,
    ).toBe(true);
  });
});
