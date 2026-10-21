import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useResource } from '../hooks/useResource';
import { requestApi } from '../services/api';
import { categories, priorities, statuses } from '../types';
import { label } from '../utils/format';
import { ErrorState, Loading, PageHeading } from '../components/ui';
import { Pagination, RequestTable } from '../components/RequestTable';

export function RequestList() {
  const { user } = useAuth();
  const admin = user?.role === 'ADMIN';
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  useEffect(() => {
    setSearch(params.get('search') || '');
  }, [params]);
  const rawPage = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = [5, 10, 20].includes(Number(params.get('limit')))
    ? Number(params.get('limit'))
    : 10;
  const query = params.toString();
  const loader = useCallback(
    () =>
      requestApi.list({
        ...Object.fromEntries(new URLSearchParams(query)),
        page,
        limit,
      }),
    [query, page, limit],
  );
  const { data, error, loading, reload } = useResource(loader);
  function change(key: string, value: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  }
  return (
    <>
      <PageHeading
        eyebrow="REQUEST CENTER"
        title={admin ? 'All service requests' : 'My requests'}
        description={
          admin
            ? 'Keep work organized, prioritize requests, and help your team move forward.'
            : 'Every request and every update. Right where you need them.'
        }
        action={
          !admin && (
            <Link className="btn primary" to="/requests/new">
              <Plus size={17} />
              New request
            </Link>
          )
        }
      />
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{admin ? 'Request management' : 'Your requests'}</h2>
            <p>Find the details. Follow the progress.</p>
          </div>
          <SlidersHorizontal size={19} className="muted" />
        </div>
        <div className="filters">
          <form
            className="search-input"
            onSubmit={(e) => {
              e.preventDefault();
              change('search', search.trim());
            }}
          >
            <Search size={17} />
            <input
              aria-label="Search requests"
              placeholder="Search title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          {[
            { key: 'status', name: 'All statuses', values: statuses },
            { key: 'category', name: 'All categories', values: categories },
            { key: 'priority', name: 'All priorities', values: priorities },
          ].map((filter) => (
            <select
              key={filter.key}
              aria-label={filter.key}
              value={params.get(filter.key) || ''}
              onChange={(e) => change(filter.key, e.target.value)}
            >
              <option value="">{filter.name}</option>
              {filter.values.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          ))}
          <select
            aria-label="Sort requests"
            value={params.get('sort') || 'newest'}
            onChange={(e) => change('sort', e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <select
            aria-label="Requests per page"
            value={limit}
            onChange={(e) => change('limit', e.target.value)}
          >
            {[5, 10, 20].map((value) => (
              <option key={value} value={value}>
                {value} per page
              </option>
            ))}
          </select>
          {query && (
            <button className="text-link" onClick={() => setParams({})}>
              Reset filters
            </button>
          )}
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : (
          data && (
            <>
              <RequestTable requests={data.data} admin={admin} />
              <Pagination
                {...data.pagination}
                onPage={(value) => change('page', String(value))}
              />
            </>
          )
        )}
      </section>
    </>
  );
}
