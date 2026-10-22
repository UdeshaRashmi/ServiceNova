import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ServiceRequest } from '../types';
import { date, label } from '../utils/format';
import { Badge, EmptyState } from './ui';

export function RequestTable({
  requests,
  admin = false,
}: {
  requests: ServiceRequest[];
  admin?: boolean;
}) {
  if (!requests.length) return <EmptyState />;
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Requests table"
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th>Request</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            {admin && <th>Submitted by</th>}
            <th>Created</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <Link className="request-title" to={`/requests/${request.id}`}>
                  {request.title}
                </Link>
                <span className="request-id">
                  #{request.id.slice(0, 8).toUpperCase()}
                </span>
              </td>
              <td>{label(request.category)}</td>
              <td>
                <Badge value={request.priority} />
              </td>
              <td>
                <Badge value={request.status} />
              </td>
              {admin && <td>{request.user?.name || '—'}</td>}
              <td className="nowrap">{date(request.createdAt)}</td>
              <td>
                <Link
                  className="icon-btn"
                  aria-label={`View ${request.title}`}
                  to={`/requests/${request.id}`}
                >
                  <ArrowRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({
  page,
  totalPages,
  totalItems,
  onPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {totalItems} result{totalItems !== 1 ? 's' : ''} · Page {page} of{' '}
        {Math.max(1, totalPages)}
      </span>
      <div>
        <button
          className="btn secondary small"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="btn secondary small"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
