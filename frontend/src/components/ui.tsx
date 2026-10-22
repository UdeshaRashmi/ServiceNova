import { useEffect, useRef, useId, type ReactNode } from 'react';
import { ArrowUpRight, CircleAlert, Inbox, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { label } from '../utils/format';
import serviceNovaLogo from '../images/ServiceNova Logo.png';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link
      to={to}
      className="brand"
      title={to === '/' ? 'Go to home' : 'Go to dashboard'}
    >
      <span className="sr-only">{to === '/' ? 'Home: ' : 'Dashboard: '}</span>
      <span className="brand-icon">
        <img src={serviceNovaLogo} alt="" aria-hidden="true" />
      </span>
      <span>
        Service<span className="brand-light">Nova</span>
        <small>REQUEST MANAGEMENT</small>
      </span>
    </Link>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge ${value.toLowerCase()}`}>
      <span />
      {label(value)}
    </span>
  );
}
export function Loading() {
  return (
    <div role="status" aria-label="Loading" className="skeleton-group">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-28" />
      <div className="skeleton h-56" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="state error-state" role="alert">
      <CircleAlert size={30} />
      <h3>We couldn’t load this</h3>
      <p>{message}</p>
      {retry && (
        <button className="btn secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title = 'No requests yet',
  description = 'Your requests will appear here. Create your first request to get started.',
  action = true,
}: {
  title?: string;
  description?: string;
  action?: boolean;
}) {
  return (
    <div className="state">
      <span className="empty-icon">
        <Inbox size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <Link className="btn primary" to="/requests/new">
          Create a request <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function ConfirmDialog({
  title,
  children,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = ref.current?.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled)',
        );
        const first = controls?.[0];
        const last = controls?.[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="panel-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      <p id={descriptionId}>{children}</p>
      <div className="form-actions">
        <button className="btn secondary" disabled={busy} onClick={onClose}>
          Go back
        </button>
        <button className="btn danger" disabled={busy} onClick={onConfirm}>
          {busy ? 'Please wait…' : 'Confirm'}
        </button>
      </div>
    </dialog>
  );
}
