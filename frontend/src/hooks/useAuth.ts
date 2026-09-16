import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { clearAuthSession, getAuthUser, setAuthSession, type AuthUser } from '../auth'
import { login, register } from '../api/authApi'

export type AuthMode = 'login' | 'register'

export type AuthSubmitPayload = {
  email: string
  password: string
  rememberTerminal?: boolean
  firstName?: string
  lastName?: string
  traderId?: string
  desk?: string
}

function getAuthErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const payloadMessage = error.response?.data?.message
    if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
      return payloadMessage
    }
    if (Array.isArray(payloadMessage)) {
      const joined = payloadMessage.filter((item): item is string => typeof item === 'string' && item.trim() !== '').join(' ')
      if (joined) {
        return joined
      }
    }
  }

  return 'Authentication failed'
}

export function useAuth() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getAuthUser())
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthUser()))

  useEffect(() => {
    setCurrentUser(getAuthUser())
    setIsAuthenticated(Boolean(getAuthUser()))

    const handleSessionExpired = (event: Event) => {
      const message = event instanceof CustomEvent ? String(event.detail ?? '') : ''
      if (message) {
        setAuthError(message)
      }
      clearAuthSession()
      setCurrentUser(null)
      setIsAuthenticated(false)
    }

    const pendingMessage = localStorage.getItem('trading-desk-auth-message')
    if (pendingMessage) {
      handleSessionExpired(new CustomEvent('session-expired', { detail: pendingMessage }))
      localStorage.removeItem('trading-desk-auth-message')
    }

    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [])

  const handleAuthSubmit = async (payload: AuthSubmitPayload) => {
    setAuthError(null)
    setIsSubmitting(true)

    try {
      const result = authMode === 'register'
        ? await register({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            traderId: payload.traderId,
            desk: payload.desk,
            password: payload.password,
          })
        : await login({ email: payload.email, password: payload.password })

      const user: AuthUser = {
        id: result.user?.id ?? payload.email,
        email: result.user?.email ?? payload.email,
        firstName: result.user?.firstName ?? payload.firstName,
        lastName: result.user?.lastName ?? payload.lastName,
        traderId: result.user?.traderId ?? payload.traderId,
        desk: result.user?.desk ?? payload.desk,
      }

      localStorage.removeItem('trading-desk-auth-message')
      setAuthSession(result.access_token, user, payload.rememberTerminal ?? true)
      setCurrentUser(user)
      setIsAuthenticated(true)
    } catch (error) {
      setAuthError(getAuthErrorMessage(error))
      setIsAuthenticated(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    setCurrentUser(null)
    setIsAuthenticated(false)
  }

  return {
    authMode,
    setAuthMode,
    authError,
    isSubmitting,
    currentUser,
    isAuthenticated,
    handleAuthSubmit,
    handleLogout,
  }
}
