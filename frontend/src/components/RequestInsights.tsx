import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3 } from 'lucide-react';
import { useResource } from '../hooks/useResource';
import { requestApi } from '../services/api';
import { ErrorState, Loading } from './ui';
import { label } from '../utils/format';
import type { Metrics, RequestActivity } from '../types';
import './request-insights.css';

export function StatusChart({ metrics }: { metrics: Metrics }) {
  const rows = [
    { status: 'PENDING', count: metrics.pending },
    { status: 'IN_PROGRESS', count: metrics.inProgress },
    { status: 'RESOLVED', count: metrics.resolved },
    {
      status: 'CANCELLED',
      count:
        metrics.total - metrics.pending - metrics.inProgress - metrics.resolved,
    },
  ];
  return (
    <section
      className="panel request-chart"
      aria-labelledby="status-chart-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="status-chart-title">Request status overview</h2>
          <p>Current distribution across your accessible requests.</p>
        </div>
      </div>
      {metrics.total === 0 ? (
        <p className="insights-empty">
          No requests yet. Your status breakdown will appear here.
        </p>
      ) : (
        <ul className="status-bars">
          {rows.map(({ status, count }) => (
            <li key={status}>
              <Link
                to={`/requests?status=${status}`}
                aria-describedby={`status-${status}-count`}
              >
                <span className="bar-caption">
                  <span>{label(status)}</span>
                  <span>
                    {count}{' '}
                    <small>
                      ({Math.round((count / metrics.total) * 100)}%)
                    </small>
                  </span>
                </span>
                <span className="bar-track" aria-hidden="true">
                  <span
                    className={`bar-fill bar-${status.toLowerCase()}`}
                    style={{ width: `${(count / metrics.total) * 100}%` }}
                  />
                </span>
              </Link>
              <span className="sr-only" id={`status-${status}-count`}>
                {count} of {metrics.total} requests
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function activityText(item: RequestActivity) {
  switch (item.type) {
    case 'CREATED':
      return 'Request submitted';
    case 'UPDATED':
      return `Updated ${(item.changedFields || 'request details').split(',').map(label).join(', ')}`;
    case 'STATUS_CHANGED':
      return `${label(item.fromStatus || '')} → ${label(item.toStatus || '')}`;
    case 'TRACKING_STARTED':
      return `History tracking started · ${label(item.toStatus || '')}`;
  }
}

export function RequestTimeline({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const loader = useCallback(() => requestApi.history(id, page), [id, page]);
  const { data, error, loading, reload } = useResource(loader);
  return (
    <section
      className="panel request-timeline"
      aria-labelledby="timeline-title"
    >
      <div className="panel-heading">
        <div>
          <h2 id="timeline-title">Request history</h2>
          <p>Changes and progress, newest first.</p>
        </div>
        <Clock3 size={20} aria-hidden="true" />
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        data && (
          <>
            {data.data.length ? (
              <ol className="activity-list">
                {data.data.map((item) => (
                  <li key={item.id}>
                    <span
                      className={`activity-marker activity-${item.type.toLowerCase()}`}
                      aria-hidden="true"
                    />
                    <div>
                      <h3>{activityText(item)}</h3>
                      <p>
                        {item.type === 'TRACKING_STARTED'
                          ? 'System'
                          : item.actor?.name || 'Unavailable account'}
                      </p>
                      <time dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </time>
                      {item.type === 'TRACKING_STARTED' && (
                        <p className="history-note">
                          Earlier changes were not recorded. This is the status
                          when tracking began.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="insights-empty">No activity recorded.</p>
            )}
            {data.pagination.totalPages > 1 && (
              <nav className="history-pagination" aria-label="History pages">
                <button
                  className="btn secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Newer
                </button>
                <span>
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  className="btn secondary"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Older
                </button>
              </nav>
            )}
          </>
        )
      )}
    </section>
  );
}
