import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Landmark, LockKeyhole } from 'lucide-react';
import './login.css';

type LoginProps = {
  onLoginSuccess: () => void;
};

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.token) {
        setError(result.message || result.error || 'Invalid username or password. Please try again.');
        return;
      }

      sessionStorage.setItem('token', result.token);
      sessionStorage.setItem('user', result.username || username.trim());
      if (result.role) sessionStorage.setItem('role', result.role);
      onLoginSuccess();
    } catch {
      setError('Unable to connect to the server. Please check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-topbar">
        <div className="login-brand">
          <span className="login-brand-mark"><Landmark size={23} strokeWidth={2.2} /></span>
          <span>Northstar<span className="brand-light"> Banking</span></span>
        </div>
        <div className="secure-label"><ShieldCheck size={16} /> Secure client access</div>
      </div>

      <section className="login-shell">
        <aside className="login-hero">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-content">
            <span className="hero-eyebrow">NORTHSTAR • CLIENT PORTAL</span>
            <h1>Banking that moves<br />you <span>forward.</span></h1>
            <p>One secure place to manage customer relationships, accounts, and the details that matter.</p>
            <div className="hero-feature">
              <span className="feature-icon"><ShieldCheck size={19} /></span>
              <div><strong>Security at every step</strong><small>Your access is protected by secure authentication.</small></div>
            </div>
            <div className="hero-decoration" aria-hidden="true">
              <div className="decoration-card card-back" />
              <div className="decoration-card card-front">
                <div className="mini-card-top"><span>NS</span><span>••••  4829</span></div>
                <div className="mini-card-bottom"><span>CLIENT ACCOUNT</span><span>✦</span></div>
              </div>
            </div>
          </div>
          <div className="hero-footer">A clearer view of every relationship.</div>
        </aside>

        <section className="login-form-panel">
          <div className="form-inner">
            <div className="form-symbol"><LockKeyhole size={22} /></div>
            <div className="form-kicker">WELCOME BACK</div>
            <h2>Sign in to your account</h2>
            <p className="form-subtitle">Enter your credentials to continue to your workspace.</p>

            {error && <div className="login-error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label htmlFor="username">Username or email</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />

              <div className="password-label-row">
                <label htmlFor="password">Password</label>
              </div>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'} {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="form-security"><ShieldCheck size={15} /> Your information is encrypted and secure.</div>
          </div>
          <div className="form-bottom">© 2026 Northstar Banking <span>•</span> Client Management Suite</div>
        </section>
      </section>
      <div className="login-page-footer">Designed for secure, simple client management.</div>
    </main>
  );
}
