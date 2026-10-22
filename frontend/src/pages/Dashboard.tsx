import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  Clock3,
  Layers3,
  LoaderCircle,
  Plus,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useResource } from '../hooks/useResource';
import { requestApi } from '../services/api';
import { ErrorState, Loading, PageHeading } from '../components/ui';
import { StatusChart } from '../components/RequestInsights';
import { RequestTable } from '../components/RequestTable';

export function Dashboard() {
  const { user } = useAuth();
  const admin = user?.role === 'ADMIN';
  const loader = useCallback(async () => {
    const [metrics, recent] = await Promise.all([
      requestApi.metrics(),
      requestApi.list({ page: 1, limit: 5, sort: 'newest' }),
    ]);
    return { metrics, recent };
  }, []);
  const { data, error, loading, reload } = useResource(loader);
  return (
    <>
      <PageHeading
        eyebrow={admin ? 'WORKSPACE OVERVIEW' : 'YOUR WORKSPACE AT A GLANCE'}
        title={`Welcome back, ${user?.name.split(' ')[0]}.`}
        description={
          admin
            ? 'A clear view of your team’s requests and the progress that matters.'
            : 'A little less admin. A little more progress. Here’s where things stand.'
        }
        action={
          <Link
            className="btn primary"
            to={admin ? '/requests' : '/requests/new'}
          >
            {admin ? <Layers3 size={17} /> : <Plus size={17} />}
            {admin ? 'Manage requests' : 'New request'}
          </Link>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        data && (
          <>
            <section className="stats-grid" aria-label="Request statistics">
              {[
                {
                  title: 'Total requests',
                  value: data.metrics.total,
                  icon: Layers3,
                  color: 'blue',
                  text: 'Everything in one place',
                },
                {
                  title: 'Pending',
                  value: data.metrics.pending,
                  icon: Clock3,
                  color: 'amber',
                  text: 'Waiting to get started',
                },
                {
                  title: 'In progress',
                  value: data.metrics.inProgress,
                  icon: LoaderCircle,
                  color: 'teal',
                  text: 'Moving toward a solution',
                },
                {
                  title: 'Resolved',
                  value: data.metrics.resolved,
                  icon: CheckCheck,
                  color: 'green',
                  text: 'Successfully completed',
                },
              ].map((item) => (
                <article className="stat-card" key={item.title}>
                  <div className="stat-top">
                    <span>{item.title}</span>
                    <span className={`stat-icon ${item.color}`}>
                      <item.icon size={19} />
                    </span>
                  </div>
                  <strong>{item.value}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </section>
            <StatusChart metrics={data.metrics} />
            <section className="welcome-banner">
              <div>
                <span className="eyebrow">
                  {admin ? 'KEEP YOUR TEAM MOVING' : 'WE’RE HERE TO HELP'}
                </span>
                <h2>
                  {admin
                    ? 'Great service starts with a clear overview.'
                    : 'Something needs a solution?'}
                </h2>
                <p>
                  {admin
                    ? 'Review incoming requests, prioritize work, and move things forward.'
                    : 'Send a request to the right team. We’ll keep you in the loop.'}
                </p>
                <Link to={admin ? '/users' : '/requests/new'}>
                  {admin ? 'Manage your team' : 'Let’s get it sorted'}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
              <div className="banner-symbol" aria-hidden="true">
                <Layers3 size={65} strokeWidth={1.2} />
              </div>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent requests</h2>
                  <p>The latest updates, all in one place.</p>
                </div>
                <Link className="text-link" to="/requests">
                  View all requests
                  <ArrowRight size={16} />
                </Link>
              </div>
              <RequestTable requests={data.recent.data} admin={admin} />
            </section>
            {admin && (
              <Link className="team-summary" to="/users">
                <span className="stat-icon blue">
                  <Users size={20} />
                </span>
                <div>
                  <strong>
                    {data.metrics.totalUsers ?? '—'} registered users
                  </strong>
                  <p>View and manage workspace members</p>
                </div>
                <ArrowRight size={20} />
              </Link>
            )}
            <p className="dashboard-note">
              <span className="online-dot" />A little organization. A lot of
              possibility.
            </p>
          </>
        )
      )}
    </>
  );
}
