import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useResource } from '../hooks/useResource';
import { userApi, errorMessage } from '../services/api';
import { date, initials, label } from '../utils/format';
import { EmptyState, ErrorState, Loading, PageHeading } from '../components/ui';
import { Pagination } from '../components/RequestTable';

export function Users() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const loader = useCallback(
    () => userApi.list({ search: query, page, limit: 10 }),
    [query, page],
  );
  const { data, error, loading, reload } = useResource(loader);
  return (
    <>
      <PageHeading
        eyebrow="PEOPLE & PERMISSIONS"
        title="User management"
        description="The people behind the progress. Manage your workspace members."
      />
      <section className="panel">
        <div className="panel-heading">
          <h2>Workspace members</h2>
        </div>
        <div className="filters">
          <form
            className="search-input"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
              setPage(1);
            }}
          >
            <Search size={17} />
            <input
              placeholder="Search name or email…"
              aria-label="Search users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button>Search</button>
          </form>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : (
          data && (
            <>
              {data.data.length ? (
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Members table"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Role</th>
                        <th>Requests</th>
                        <th>Joined</th>
                        <th>
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="member-cell">
                              <span className="avatar">
                                {initials(user.name)}
                              </span>
                              <div>
                                <Link
                                  className="request-title"
                                  to={`/users/${user.id}`}
                                >
                                  {user.name}
                                </Link>
                                <span className="request-id">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`role-tag ${user.role.toLowerCase()}`}
                            >
                              {label(user.role)}
                            </span>
                          </td>
                          <td>{user._count?.requests ?? '—'}</td>
                          <td>{date(user.createdAt)}</td>
                          <td>
                            <Link
                              className="icon-btn"
                              aria-label={`View ${user.name}`}
                              to={`/users/${user.id}`}
                            >
                              <ArrowRight size={17} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No members found"
                  description="Try a different name or email address."
                  action={false}
                />
              )}
              <Pagination {...data.pagination} onPage={setPage} />
            </>
          )
        )}
      </section>
    </>
  );
}
const userSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(100, 'Use no more than 100 characters.'),
});
function NameForm({
  id,
  name,
  onSaved,
}: {
  id: string;
  name: string;
  onSaved: () => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>({
    resolver: zodResolver(userSchema),
    defaultValues: { name },
  });
  async function submit(values: { name: string }) {
    try {
      await userApi.update(id, values);
      toast.success('Member updated.');
      await onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <form className="request-form" onSubmit={handleSubmit(submit)} noValidate>
      <label>
        Display name
        <input
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'display-name-error' : undefined}
        />
        {errors.name && (
          <span id="display-name-error" className="field-error">
            {errors.name.message}
          </span>
        )}
      </label>
      <p className="field-help">
        Display names can be updated here. Roles and sign-in credentials are
        managed separately.
      </p>
      <div className="form-actions">
        <button className="btn primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
export function UserDetail() {
  const { id = '' } = useParams();
  const loader = useCallback(() => userApi.get(id), [id]);
  const { data, error, loading, reload } = useResource(loader);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data) return null;
  return (
    <>
      <Link className="back-link" to="/users">
        <ArrowLeft size={16} />
        Back to members
      </Link>
      <PageHeading
        title={data.name}
        description={data.email}
        action={<span className="role-tag">{label(data.role)}</span>}
      />
      <section className="panel narrow-panel">
        <div className="panel-heading">
          <div>
            <h2>Member information</h2>
            <p>Joined {date(data.createdAt)}</p>
          </div>
        </div>
        <NameForm
          key={data.updatedAt ?? data.name}
          id={id}
          name={data.name}
          onSaved={reload}
        />
      </section>
    </>
  );
}
