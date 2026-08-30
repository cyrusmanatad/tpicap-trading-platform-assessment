import { useMemo, useState } from 'react';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    traderId?: string;
    desk?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export function AuthForm({ mode, onSubmit, isSubmitting = false, error = null }: AuthFormProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [traderId, setTraderId] = useState('');
  const [desk, setDesk] = useState('EQUITIES_US');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (registerPassword.length >= 8) score += 1;
    if (registerPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(registerPassword) && /[a-z]/.test(registerPassword)) score += 1;
    if (/\d/.test(registerPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(registerPassword)) score += 1;
    return Math.min(score, 4);
  }, [registerPassword]);

  const passwordStrength = ['WEAK', 'FAIR', 'GOOD', 'STRONG', 'STRONG'][passwordScore] ?? 'WEAK';
  const passwordColor = ['#ff5470', '#f5b942', '#3d8bfd', '#2fd48a', '#2fd48a'][passwordScore] ?? '#ff5470';

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ email: loginEmail, password: loginPassword });
  };

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      firstName,
      lastName,
      email: registerEmail,
      traderId: traderId.toUpperCase(),
      desk,
      password: registerPassword,
    });
  };

  const renderPasswordToggle = (inputId: string) => (
    <button
      type="button"
      className="password-toggle mono"
      onClick={() => {
        const element = document.getElementById(inputId) as HTMLInputElement | null;
        if (element) {
          element.type = element.type === 'password' ? 'text' : 'password';
        }
      }}
    >
      SHOW
    </button>
  );

  if (mode === 'login') {
    return (
      <form className="auth-panel" onSubmit={handleLoginSubmit}>
        <h2 className="auth-title mono">LOGIN</h2>

        {error ? <div className="auth-error mono">{error}</div> : null}

        <label className="field mono">
          <span>DESK ID / EMAIL *</span>
          <input
            type="text"
            value={loginEmail}
            onChange={(event) => setLoginEmail(event.target.value)}
            placeholder="cyrus@brokerage.com"
            required
          />
        </label>

        <label className="field mono">
          <span>PASSWORD *</span>
          <div className="password-field">
            <input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="••••••••••"
              required
              minLength={8}
            />
            {renderPasswordToggle('login-password')}
          </div>
        </label>

        <div className="auth-meta-row">
          <label className="remember-box mono">
            <input type="checkbox" defaultChecked />
            <span>REMEMBER THIS TERMINAL</span>
          </label>
          <button type="button" className="text-link mono">FORGOT?</button>
        </div>

        <button type="submit" className="primary-btn mono" disabled={isSubmitting}>
          {isSubmitting ? 'SIGNING IN...' : 'LOG IN TO DESK'}
        </button>

        <div className="demo-credentials mono">DEMO CREDENTIALS — CYRUS@BROKERAGE.COM / TRADE2026!</div>
      </form>
    );
  }

  return (
    <form className="auth-panel" onSubmit={handleRegisterSubmit}>
      <h2 className="auth-title mono">REGISTER</h2>

      {error ? <div className="auth-error mono">{error}</div> : null}

      <div className="field-row two-up">
        <label className="field mono">
          <span>FIRST NAME *</span>
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="CYRUS" required />
        </label>

        <label className="field mono">
          <span>LAST NAME *</span>
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="MANATAD" required />
        </label>
      </div>

      <label className="field mono">
        <span>WORK EMAIL *</span>
        <input
          type="email"
          value={registerEmail}
          onChange={(event) => setRegisterEmail(event.target.value)}
          placeholder="cyrus@brokerage.com"
          required
        />
      </label>

      <div className="field-row two-up">
        <label className="field mono">
          <span>TRADER ID *</span>
          <input
            value={traderId}
            onChange={(event) => setTraderId(event.target.value.toUpperCase())}
            placeholder="CYRUS"
            maxLength={10}
            required
          />
        </label>

        <label className="field mono">
          <span>DESK / BOOK</span>
          <select value={desk} onChange={(event) => setDesk(event.target.value)}>
            <option value="EQUITIES_US">EQUITIES_US</option>
            <option value="EQUITIES_UK">EQUITIES_UK</option>
            <option value="TECH_GROWTH">TECH_GROWTH</option>
          </select>
        </label>
      </div>

      <label className="field mono">
        <span>PASSWORD *</span>
        <div className="password-field">
          <input
            id="register-password"
            type="password"
            value={registerPassword}
            onChange={(event) => setRegisterPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            required
            minLength={8}
          />
          {renderPasswordToggle('register-password')}
        </div>
      </label>

      <div className="strength-row mono">
        <div className="strength-bar">
          <span className="strength-fill" style={{ width: `${(passwordScore / 4) * 100}%`, background: passwordColor }} />
        </div>
        <span style={{ color: passwordColor }}>{passwordStrength}</span>
      </div>

      <label className="field mono">
        <span>CONFIRM PASSWORD *</span>
        <div className="password-field">
          <input
            id="register-password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter password"
            required
          />
          {renderPasswordToggle('register-password-confirm')}
        </div>
      </label>

      <label className="terms-row mono">
        <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
        <span>I agree to the desk compliance policy and trading terms.</span>
      </label>

      <button type="submit" className="primary-btn mono" disabled={isSubmitting}>
        {isSubmitting ? 'CREATING...' : 'CREATE ACCOUNT'}
      </button>
    </form>
  );
}
