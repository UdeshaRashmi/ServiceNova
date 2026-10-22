import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ClipboardList,
  Layers3,
  ListFilter,
  LockKeyhole,
  Menu,
  Send,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import './home.css';

const steps = [
  {
    number: '01',
    title: 'Submit',
    description:
      'Describe what you need, choose a category, and set the right priority.',
    icon: Send,
  },
  {
    number: '02',
    title: 'Track',
    description:
      'Find your requests in one place and check their current status whenever you need.',
    icon: ClipboardList,
  },
  {
    number: '03',
    title: 'Resolve',
    description:
      'Administrators move work forward through clear, controlled status changes.',
    icon: CheckCheck,
  },
];
const features = [
  {
    icon: Layers3,
    title: 'A place for every request',
    description:
      'Keep technical, billing, account, and other requests organized in a single workspace.',
  },
  {
    icon: ListFilter,
    title: 'Find what matters',
    description:
      'Search, filter, sort, and page through requests without losing the bigger picture.',
  },
  {
    icon: ShieldCheck,
    title: 'The right access',
    description:
      'Members see their own requests. Administrators have the tools to manage the workspace.',
  },
  {
    icon: Users,
    title: 'Clarity for both sides',
    description:
      'Dedicated dashboards help members follow their work and administrators manage incoming requests.',
  },
];

export function Home() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const destination = user ? '/dashboard' : '/register';
  const actionLabel = user ? 'Open dashboard' : 'Get started';
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-container home-header-inner">
          <Logo />
          <nav
            className={`home-nav ${menuOpen ? 'is-open' : ''}`}
            id="home-navigation"
            aria-label="Main navigation"
            onClick={() => setMenuOpen(false)}
          >
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#about">About</a>
            {!user && (
              <Link className="home-mobile-signin" to="/login">
                Sign in <ArrowUpRight size={16} />
              </Link>
            )}
          </nav>
          <div className="home-header-actions">
            {!user && (
              <Link className="home-signin" to="/login">
                Sign in
              </Link>
            )}
            <Link className="btn primary" to={destination}>
              {actionLabel}
              <ArrowUpRight size={16} />
            </Link>
            <button
              className="home-menu-toggle"
              type="button"
              aria-label={
                menuOpen ? 'Close main navigation' : 'Open main navigation'
              }
              aria-expanded={menuOpen}
              aria-controls="home-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-container home-hero-grid">
            <div className="home-hero-copy">
              <span className="home-pill">
                <span /> LESS FRICTION. MORE PROGRESS.
              </span>
              <h1 id="home-title">
                Every request.
                <br />A clear way <span>forward.</span>
              </h1>
              <p className="home-tagline">
                Simplify requests. Accelerate solutions.
              </p>
              <p className="home-lead">
                From the first “can you help?” to the final resolution, bring
                your service requests into one organized, easy-to-follow
                workspace.
              </p>
              <div className="home-hero-actions">
                <Link className="btn primary" to={destination}>
                  {actionLabel}
                  <ArrowRight size={18} />
                </Link>
                <a className="home-secondary-link" href="#how-it-works">
                  See how it works <ArrowUpRight size={17} />
                </a>
              </div>
              <div className="home-reassurance">
                <span>
                  <Check size={15} />
                  Clear request tracking
                </span>
                <span>
                  <Check size={15} />
                  Secure account access
                </span>
              </div>
            </div>

            <div
              className="home-journey"
              aria-label="Illustration of the service request workflow"
            >
              <div className="home-journey-top">
                <span className="home-journey-symbol">
                  <Layers3 size={22} />
                </span>
                <div>
                  <strong>From request to resolution</strong>
                  <span>A simpler way to keep work moving</span>
                </div>
              </div>
              <div className="home-journey-steps">
                <div className="home-journey-step">
                  <span className="home-step-symbol pending">
                    <Send size={19} />
                  </span>
                  <div>
                    <span className="home-step-caption">A CLEAR START</span>
                    <h2>Request submitted</h2>
                    <p>The details, category, and priority are in one place.</p>
                    <span className="home-stage pending">Pending</span>
                  </div>
                </div>
                <div className="home-journey-step">
                  <span className="home-step-symbol progress">
                    <ClipboardList size={19} />
                  </span>
                  <div>
                    <span className="home-step-caption">VISIBLE PROGRESS</span>
                    <h2>Work moves forward</h2>
                    <p>An administrator updates the status as work begins.</p>
                    <span className="home-stage progress">In progress</span>
                  </div>
                </div>
                <div className="home-journey-step">
                  <span className="home-step-symbol resolved">
                    <CheckCheck size={19} />
                  </span>
                  <div>
                    <span className="home-step-caption">A CLEAR FINISH</span>
                    <h2>Resolution, recorded</h2>
                    <p>The completed request stays available to review.</p>
                    <span className="home-stage resolved">Resolved</span>
                  </div>
                </div>
              </div>
              <div className="home-journey-footer">
                <LockKeyhole size={15} />
                Clear ownership. Controlled access.
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="home-section home-features"
          aria-labelledby="features-title"
        >
          <div className="home-container">
            <div className="home-section-heading">
              <p className="home-eyebrow">BUILT AROUND THE WORK</p>
              <h2 id="features-title">
                Everything in place.
                <br />
                Everyone on the same page.
              </h2>
              <p>
                Practical tools that make requests easier to submit, find, and
                manage.
              </p>
            </div>
            <div className="home-feature-grid">
              {features.map((feature) => (
                <article className="home-feature" key={feature.title}>
                  <span className="home-feature-icon">
                    <feature.icon size={23} strokeWidth={1.7} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="home-section home-how"
          aria-labelledby="how-title"
        >
          <div className="home-container">
            <div className="home-section-heading">
              <p className="home-eyebrow">A SIMPLE, SHARED PROCESS</p>
              <h2 id="how-title">Three steps. A clearer path.</h2>
              <p>
                Know where to start, where things stand, and what comes next.
              </p>
            </div>
            <div className="home-process-grid">
              {steps.map((step) => (
                <article className="home-process-step" key={step.number}>
                  <div className="home-process-top">
                    <span>{step.number}</span>
                    <step.icon size={22} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
            <p className="home-process-note">
              <ShieldCheck size={16} />
              Submitted something by mistake? Members can edit or cancel
              requests while they’re still pending.
            </p>
          </div>
        </section>

        <section
          id="about"
          className="home-section home-about"
          aria-labelledby="about-title"
        >
          <div className="home-container home-about-grid">
            <div>
              <p className="home-eyebrow">ABOUT SERVICENOVA</p>
              <h2 id="about-title">
                Less back-and-forth.
                <br />
                More getting things done.
              </h2>
            </div>
            <div className="home-about-copy">
              <p>
                ServiceNova is a service request management system built to give
                everyday requests a clear home. It connects the people asking
                for help with the administrators organizing the work.
              </p>
              <p>
                Members get a focused place to submit and follow their own
                requests. Administrators get an overview of incoming work,
                structured status changes, and tools to manage workspace
                members.
              </p>
              <Link className="home-secondary-link" to={destination}>
                {user ? 'Back to your workspace' : 'Make your first request'}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="home-cta" aria-labelledby="cta-title">
          <div className="home-container home-cta-inner">
            <div>
              <p className="home-eyebrow">MAKE ROOM FOR BETTER SERVICE</p>
              <h2 id="cta-title">Your next request starts here.</h2>
              <p>A little more clarity. A lot less chasing updates.</p>
            </div>
            <Link className="btn" to={destination}>
              {user ? 'Open your dashboard' : 'Create your account'}
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-top">
            <div>
              <Logo />
              <p>Simplify requests. Accelerate solutions.</p>
            </div>
            <nav aria-label="Footer navigation">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#about">About ServiceNova</a>
              <Link to={user ? '/dashboard' : '/login'}>
                {user ? 'Dashboard' : 'Sign in'}
              </Link>
            </nav>
          </div>
          <div className="home-footer-bottom">
            <span>© {new Date().getFullYear()} ServiceNova</span>
            <span>Service request management, with clarity.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
