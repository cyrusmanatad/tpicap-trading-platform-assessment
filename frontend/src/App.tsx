import './App.css'
import { AuthPage } from './components/AuthPage'
import { TradingDesk } from './components/TradingDesk'
import { useAuth } from './hooks/useAuth'

function App() {
  const {
    authMode,
    setAuthMode,
    authError,
    isSubmitting,
    currentUser,
    isAuthenticated,
    handleAuthSubmit,
    handleLogout,
  } = useAuth()

  if (!isAuthenticated) {
    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        onSubmit={handleAuthSubmit}
        isSubmitting={isSubmitting}
        error={authError}
      />
    )
  }

  return <TradingDesk currentUser={currentUser} onLogout={handleLogout} />
}

export default App
