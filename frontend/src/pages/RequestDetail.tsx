import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Pencil, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useResource } from '../hooks/useResource';
import { errorMessage, requestApi } from '../services/api';
import { transitions, type Status } from '../types';
import { date, label } from '../utils/format';
import {
  Badge,
  ConfirmDialog,
  ErrorState,
  Loading,
  PageHeading,
} from '../components/ui';

export function RequestDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const admin = user?.role === 'ADMIN';
  const loader = useCallback(() => requestApi.get(id), [id]);
  const { data, error, loading, reload } = useResource(loader);
  const [action, setAction] = useState<Status | 'cancel' | null>(null);
  const [busy, setBusy] = useState(false);
  async function confirm() {
    if (!action) return;
    setBusy(true);
    try {
      if (action === 'cancel') await requestApi.cancel(id);
      else await requestApi.status(id, action);
      toast.success('Request status updated.');
      setAction(null);
      await reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return null;
  const editable =
    !admin && data.userId === user?.id && data.status === 'PENDING';
  return (
    <>
      <Link className="back-link" to="/requests">
        <ArrowLeft size={16} />
        Back to requests
      </Link>
      <PageHeading
        eyebrow={`REQUEST #${data.id.slice(0, 8).toUpperCase()}`}
        title={data.title}
        description={`Submitted on ${date(data.createdAt)}`}
        action={<Badge value={data.status} />}
      />
      <div className="detail-layout">
        <section className="panel">
          <div className="panel-heading">
            <h2>Request details</h2>
          </div>
          <div className="detail-body">
            <p className="eyebrow">DESCRIPTION</p>
            <p className="description-text">{data.description}</p>
            <div className="detail-properties">
              <div>
                <span>Category</span>
                <strong>{label(data.category)}</strong>
              </div>
              <div>
                <span>Priority</span>
                <Badge value={data.priority} />
              </div>
              <div>
                <span>Request ID</span>
                <code>{data.id}</code>
              </div>
            </div>
          </div>
        </section>
        <aside className="detail-aside">
          <section className="panel">
            <div className="panel-heading">
              <h2>Activity & information</h2>
            </div>
            <div className="detail-body">
              <div className="info-row">
                <CalendarDays size={18} />
                <div>
                  <span>Created</span>
                  <strong>{date(data.createdAt)}</strong>
                </div>
              </div>
              <div className="info-row">
                <CalendarDays size={18} />
                <div>
                  <span>Last updated</span>
                  <strong>{date(data.updatedAt)}</strong>
                </div>
              </div>
              <div className="info-row">
                <UserRound size={18} />
                <div>
                  <span>Submitted by</span>
                  <strong>{data.user?.name || user?.name}</strong>
                  {data.user?.email && <small>{data.user.email}</small>}
                </div>
              </div>
            </div>
          </section>
          {(editable || (admin && transitions[data.status].length > 0)) && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Available actions</h2>
              </div>
              <div className="detail-body action-stack">
                {editable && (
                  <>
                    <Link className="btn secondary" to={`/requests/${id}/edit`}>
                      <Pencil size={16} />
                      Edit request
                    </Link>
                    <button
                      className="btn danger-outline"
                      onClick={() => setAction('cancel')}
                    >
                      Cancel request
                    </button>
                  </>
                )}
                {admin &&
                  transitions[data.status].map((status) => (
                    <button
                      className={`btn ${status === 'CANCELLED' ? 'danger-outline' : 'primary'}`}
                      key={status}
                      onClick={() => setAction(status)}
                    >
                      Mark as {label(status)}
                    </button>
                  ))}
              </div>
            </section>
          )}
          {['RESOLVED', 'CANCELLED'].includes(data.status) && (
            <p className="tips-note">
              This request is {label(data.status).toLowerCase()} and no longer
              accepts changes.
            </p>
          )}
        </aside>
      </div>
      {action && (
        <ConfirmDialog
          title={
            action === 'cancel' || action === 'CANCELLED'
              ? 'Cancel this request?'
              : 'Update request status?'
          }
          busy={busy}
          onClose={() => setAction(null)}
          onConfirm={confirm}
        >
          {action === 'cancel' || action === 'CANCELLED'
            ? 'This closes the request permanently. You can submit a new request if you need help later.'
            : `The request will move to ${label(action)}. Please confirm to continue.`}
        </ConfirmDialog>
      )}
    </>
  );
}
