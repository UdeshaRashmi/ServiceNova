import { useState } from 'react';
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LifeBuoy,
  UserRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui';
import { initials } from '../utils/format';
import { errorMessage } from '../services/api';
import { toast } from 'sonner';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(false);
  const [account, setAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const admin = user?.role === 'ADMIN';
  const section = pathname.includes('users')
    ? 'User management'
    : pathname.includes('profile')
      ? 'Profile'
      : pathname.includes('requests')
        ? 'Service requests'
        : 'Overview';
  async function signOut() {
    setBusy(true);
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-btn mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-dot" />
          {admin ? 'Administrator workspace' : 'Your workspace'}
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav onClick={() => setMobile(false)}>
          <NavLink to="/" end>
            <LayoutDashboard size={19} />
            Overview
          </NavLink>
          <NavLink to="/requests">
            <ClipboardList size={19} />
            {admin ? 'All requests' : 'My requests'}
          </NavLink>
          {!admin && (
            <NavLink to="/requests/new">
              <Plus size={19} />
              Create request
            </NavLink>
          )}
          {admin && (
            <NavLink to="/users">
              <Users size={19} />
              User management
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <LifeBuoy size={23} />
            <h3>A little clarity goes a long way.</h3>
            <p>
              Add a clear description to help your team resolve requests faster.
            </p>
          </div>
          <NavLink
            className="profile-link"
            to="/profile"
            onClick={() => setMobile(false)}
          >
            <UserRound size={18} />
            My profile
          </NavLink>
          <div className="sidebar-footer">
            <span className="online-dot" />
            Built for better service
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{section}</strong>
          </div>
          <div className="account-wrap">
            <button
              className="account-btn"
              aria-expanded={account}
              onClick={() => setAccount(!account)}
            >
              <span className="avatar">{initials(user?.name || 'User')}</span>
              <span className="account-name">
                {user?.name}
                <small>{admin ? 'Administrator' : 'Member'}</small>
              </span>
              <ChevronDown size={15} />
            </button>
            {account && (
              <>
                <button
                  className="dropdown-dismiss"
                  aria-label="Close account menu"
                  onClick={() => setAccount(false)}
                />
                <div className="account-menu">
                  <Link to="/profile" onClick={() => setAccount(false)}>
                    <UserRound size={17} />
                    My profile
                  </Link>
                  <button disabled={busy} onClick={signOut}>
                    <LogOut size={17} />
                    {busy ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="main-footer">
          <span>© {new Date().getFullYear()} ServiceNova</span>
          <span>
            <ShieldCheck size={14} /> Simplify requests. Accelerate solutions.
          </span>
        </footer>
      </div>
    </div>
  );
}
