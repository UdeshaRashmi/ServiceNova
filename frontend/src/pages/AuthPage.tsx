import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Layers3,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage } from '../services/api';
import { Logo } from '../components/ui';

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .max(128, 'Use no more than 128 characters.'),
});
type Values = z.infer<typeof schema>;
export function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const {
    register: field,
    handleSubmit,
    setError: fieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  if (auth.user) return <Navigate to="/" replace />;
  async function submit(values: Values) {
    if (register && (!values.name || values.name.length < 2)) {
      fieldError('name', {
        message: 'Enter your full name (at least 2 characters).',
      });
      return;
    }
    setError('');
    try {
      if (register)
        await auth.register({
          name: values.name!,
          email: values.email,
          password: values.password,
        });
      else await auth.login({ email: values.email, password: values.password });
      const from = location.state?.from;
      navigate(
        typeof from === 'string' &&
          from.startsWith('/') &&
          !from.startsWith('//')
          ? from
          : '/',
        { replace: true },
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <Logo />
        <div className="story-content">
          <span className="story-pill">
            <span className="online-dot" /> A better way to get things done
          </span>
          <h1>
            Less friction.
            <br />
            More <span>forward.</span>
          </h1>
          <p>
            Bring every request, update, and resolution into one beautifully
            simple workspace.
          </p>
          <div className="workflow-art" aria-hidden="true">
            <div className="workflow-node">
              <span>
                <Layers3 size={23} />
              </span>
              <div>
                One connected workspace
                <small>From first request to final resolution</small>
              </div>
            </div>
            <div className="workflow-line" />
            <div className="workflow-steps">
              <span>
                <Check size={16} />
                Submit
              </span>
              <i />
              <span>
                <Check size={16} />
                Track
              </span>
              <i />
              <span>
                <Check size={16} />
                Resolve
              </span>
            </div>
          </div>
          <div className="story-features">
            <span>
              <Check size={16} /> Every request, organized
            </span>
            <span>
              <Check size={16} /> Progress you can follow
            </span>
            <span>
              <Check size={16} /> Built around your team
            </span>
          </div>
        </div>
        <p className="story-footer">SIMPLIFY REQUESTS. ACCELERATE SOLUTIONS.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Logo />
        </div>
        <div className="auth-form-wrap">
          <p className="eyebrow">YOUR WORK, SIMPLIFIED</p>
          <h1>{register ? 'Create your account' : 'Welcome back.'}</h1>
          <p className="auth-intro">
            {register
              ? 'A clearer path from request to resolution starts here.'
              : 'Sign in to your ServiceNova workspace.'}
          </p>
          <form onSubmit={handleSubmit(submit)} noValidate>
            {register && (
              <label>
                Full name
                <input
                  autoComplete="name"
                  placeholder="e.g. Alex Morgan"
                  {...field('name')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <span className="field-error">{errors.name.message}</span>
                )}
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...field('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <span className="field-error">{errors.email.message}</span>
              )}
            </label>
            <label>
              Password
              <div className="password-input">
                <input
                  aria-label="Password"
                  aria-describedby={register ? 'password-help' : undefined}
                  type={show ? 'text' : 'password'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  placeholder={
                    register
                      ? 'Create a strong password'
                      : 'Enter your password'
                  }
                  {...field('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="field-error">{errors.password.message}</span>
              )}
              {register && (
                <small id="password-help" className="field-help">
                  Use 8–128 characters to keep your account secure.
                </small>
              )}
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button className="btn primary auth-submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait…'
                : register
                  ? 'Create account'
                  : 'Sign in'}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New to ServiceNova?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <div className="auth-secure">
            <ShieldCheck size={16} /> Your workspace. Secure by design.
          </div>
        </div>
        <p className="auth-copyright">
          © {new Date().getFullYear()} ServiceNova. Made for progress.
        </p>
      </main>
    </div>
  );
}
