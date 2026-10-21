import { useAuth } from '../contexts/AuthContext';
import { PageHeading } from '../components/ui';
import { date, initials, label } from '../utils/format';
import { ShieldCheck } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageHeading
        eyebrow="YOUR ACCOUNT"
        title="My profile"
        description="Your place in the ServiceNova workspace."
      />
      <section className="panel narrow-panel">
        <div className="profile-heading">
          <span className="avatar large">{initials(user.name)}</span>
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
          <span className="role-tag">{label(user.role)}</span>
        </div>
        <dl className="profile-fields">
          <div>
            <dt>Full name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Account role</dt>
            <dd>{label(user.role)}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{date(user.createdAt)}</dd>
          </div>
        </dl>
        <div className="profile-note">
          <ShieldCheck size={19} />
          <p>
            Need to change your display name? Contact your workspace
            administrator.
          </p>
        </div>
      </section>
    </>
  );
}
