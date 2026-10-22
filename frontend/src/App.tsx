import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorState, Loading, Logo } from './components/ui';
import { AppLayout } from './layouts/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { RequestList } from './pages/RequestList';
import { CreateRequest, EditRequest } from './pages/RequestEditor';
import { RequestDetail } from './pages/RequestDetail';
import { UserDetail, Users } from './pages/Users';
import { Profile } from './pages/Profile';
import { Home } from './pages/Home';

function Protected({ admin = false }: { admin?: boolean }) {
  const { user, loading, error, retry } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="route-state">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="route-state">
        <Logo />
        <ErrorState message={error} retry={retry} />
        <Link className="text-link" to="/login">
          Go to sign in
        </Link>
      </div>
    );
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (admin && user.role !== 'ADMIN')
    return (
      <ErrorState message="Administrator access is required to view this page." />
    );
  return <Outlet />;
}
function NotFound() {
  return (
    <div className="not-found">
      <Logo />
      <span>404</span>
      <h1>A little off track.</h1>
      <p>We couldn’t find that page. Let’s get you back to your workspace.</p>
      <Link className="btn primary" to="/dashboard">
        Back to overview
      </Link>
    </div>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/register"
            element={<AuthPage key="register" register />}
          />
          <Route element={<Protected />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="requests" element={<RequestList />} />
              <Route path="requests/new" element={<CreateRequest />} />
              <Route path="requests/:id" element={<RequestDetail />} />
              <Route path="requests/:id/edit" element={<EditRequest />} />
              <Route path="profile" element={<Profile />} />
              <Route element={<Protected admin />}>
                <Route path="users" element={<Users />} />
                <Route path="users/:id" element={<UserDetail />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
      <Toaster richColors position="top-right" closeButton />
    </BrowserRouter>
  );
}
