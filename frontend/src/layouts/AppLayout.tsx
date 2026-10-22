import { useEffect, useRef, useState } from 'react';
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
  UserRound,
  ShieldCheck,
  House,
  ArrowUpRight,
  Layers3,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui';
import { initials } from '../utils/format';
import { errorMessage } from '../services/api';
import { toast } from 'sonner';
import './sidebar.css';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(false);
  const [account, setAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('servicenova.sidebar.collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const admin = user?.role === 'ADMIN';
  useEffect(() => {
    try {
      localStorage.setItem('servicenova.sidebar.collapsed', String(collapsed));
    } catch {
      /* Navigation works when browser storage is unavailable. */
    }
  }, [collapsed]);
  useEffect(() => {
    setMobile(false);
    setAccount(false);
  }, [pathname]);
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 760) setMobile(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const main = mainRef.current;
    main?.setAttribute('inert', '');
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobile(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = [
        ...(sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ) || []),
      ].filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute('inert');
      document.removeEventListener('keydown', onKeyDown);
      if (mobileTriggerRef.current?.isConnected)
        mobileTriggerRef.current.focus();
    };
  }, [mobile]);
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
    <div
      className={`app-shell workspace-shell ${collapsed ? 'sidebar-collapsed' : ''}`}
    >
      {mobile && (
        <button
          className="sidebar-overlay"
          aria-label="Dismiss navigation"
          tabIndex={-1}
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        id="workspace-sidebar"
        className={`sidebar workspace-sidebar ${mobile ? 'open' : ''}`}
        role={mobile ? 'dialog' : undefined}
        aria-modal={mobile ? true : undefined}
        aria-label="Workspace sidebar"
      >
        <div className="sidebar-brand">
          <Logo />
          <button
            className="sidebar-collapse"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            aria-controls="workspace-sidebar"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
          <button
            ref={closeRef}
            className="icon-btn mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div
          className="sidebar-workspace"
          title={admin ? 'Administrator workspace' : 'Member workspace'}
        >
          <span className="sidebar-workspace-icon">
            {admin ? <ShieldCheck size={20} /> : <Layers3 size={20} />}
          </span>
          <div className="sidebar-workspace-copy">
            <strong>{admin ? 'Control center' : 'Your workspace'}</strong>
            <span>
              {admin ? 'Administrator access' : 'Personal service desk'}
            </span>
          </div>
          <span className="sidebar-role-dot" aria-hidden="true" />
        </div>
        <NavLink
          className="sidebar-create"
          to={admin ? '/requests' : '/requests/new'}
          end
          aria-label={admin ? 'Manage requests' : 'Create request'}
          title={
            collapsed
              ? admin
                ? 'Manage requests'
                : 'Create request'
              : undefined
          }
          onClick={() => setMobile(false)}
        >
          {admin ? <ClipboardList size={19} /> : <Plus size={20} />}
          <span>{admin ? 'Manage requests' : 'Create request'}</span>
          <ArrowUpRight size={16} className="sidebar-create-arrow" />
        </NavLink>
        <div className="sidebar-navigation">
          <p className="nav-label">
            WORKSPACE <span>01</span>
          </p>
          <nav
            aria-label="Workspace navigation"
            onClick={() => setMobile(false)}
          >
            <NavLink
              className="workspace-link"
              to="/dashboard"
              end
              aria-label="Overview"
              title={collapsed ? 'Overview' : undefined}
            >
              <LayoutDashboard size={19} />
              <span className="sidebar-link-copy">
                Overview<small>Your workspace at a glance</small>
              </span>
              <span className="sidebar-active-marker" aria-hidden="true" />
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `workspace-link ${isActive && pathname !== '/requests/new' ? 'active' : ''}`
              }
              to="/requests"
              aria-current={pathname === '/requests/new' ? false : 'page'}
              aria-label={admin ? 'All requests' : 'My requests'}
              title={
                collapsed ? (admin ? 'All requests' : 'My requests') : undefined
              }
            >
              <ClipboardList size={19} />
              <span className="sidebar-link-copy">
                {admin ? 'All requests' : 'My requests'}
                <small>
                  {admin
                    ? 'Review, prioritize, resolve'
                    : 'Follow every update'}
                </small>
              </span>
              <span className="sidebar-active-marker" aria-hidden="true" />
            </NavLink>
            {admin && (
              <NavLink
                className="workspace-link"
                to="/users"
                aria-label="User management"
                title={collapsed ? 'User management' : undefined}
              >
                <Users size={19} />
                <span className="sidebar-link-copy">
                  User management<small>The people behind the work</small>
                </span>
                <span className="sidebar-active-marker" aria-hidden="true" />
              </NavLink>
            )}
          </nav>
          <p className="nav-label sidebar-personal-label">
            PERSONAL <span>02</span>
          </p>
          <nav
            aria-label="Personal navigation"
            onClick={() => setMobile(false)}
          >
            <NavLink
              className="workspace-link"
              to="/profile"
              aria-label="My profile"
              title={collapsed ? 'My profile' : undefined}
            >
              <UserRound size={19} />
              <span className="sidebar-link-copy">
                My profile<small>Your account details</small>
              </span>
              <span className="sidebar-active-marker" aria-hidden="true" />
            </NavLink>
            <NavLink
              className="workspace-link"
              to="/"
              end
              aria-label="Home"
              title={collapsed ? 'Back to home' : undefined}
            >
              <House size={19} />
              <span className="sidebar-link-copy">
                Home<small>Back to ServiceNova</small>
              </span>
              <ArrowUpRight className="sidebar-home-arrow" size={16} />
            </NavLink>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="sidebar-note-tag">
              <span />
              THE SERVICENOVA WAY
            </span>
            <h3>
              {admin
                ? 'A clear queue. A focused team.'
                : 'Good details. Better solutions.'}
            </h3>
            <p>
              {admin
                ? 'Keep incoming work organized and move each request forward.'
                : 'A clear title and description help your team get started.'}
            </p>
          </div>
          <div className="sidebar-account">
            <Link
              className="sidebar-account-link"
              to="/profile"
              aria-label="View my profile"
              title={
                collapsed
                  ? `${user?.name || 'My account'} — My profile`
                  : undefined
              }
              onClick={() => setMobile(false)}
            >
              <span className="avatar">{initials(user?.name || 'User')}</span>
              <span className="sidebar-account-copy">
                <strong>{user?.name}</strong>
                <small>{admin ? 'Administrator' : 'Workspace member'}</small>
              </span>
            </Link>
            <button
              className="sidebar-signout"
              disabled={busy}
              onClick={signOut}
              aria-label="Sign out of workspace"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell" ref={mainRef}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={mobileTriggerRef}
              className="icon-btn mobile-toggle"
              aria-label="Open navigation"
              aria-expanded={mobile}
              aria-controls="workspace-sidebar"
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
