import { AuthForm } from './AuthForm'
import type { AuthMode, AuthSubmitPayload } from '../hooks/useAuth'

type AuthPageProps = {
  authMode: AuthMode
  setAuthMode: (mode: AuthMode) => void
  onSubmit: (payload: AuthSubmitPayload) => Promise<void>
  isSubmitting: boolean
  error: string | null
}

export function AuthPage({ authMode, setAuthMode, onSubmit, isSubmitting, error }: AuthPageProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card panel">
        <div className="auth-header">
          <div className="brand-mark mono">B</div>
          <div>
            <div className="brand-title mono">BLOTTER</div>
            <div className="brand-subtitle mono">TRADING DESK ACCESS</div>
          </div>
        </div>

        <div className="auth-toggle mono">
          <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
            LOGIN
          </button>
          <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
            REGISTER
          </button>
        </div>

        <AuthForm
          mode={authMode}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>
    </div>
  )
}
