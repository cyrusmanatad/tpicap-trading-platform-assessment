import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import './App.css'
import { AuthForm } from './components/AuthForm'
import { FilterButton } from './components/FilterButton'
import { MetricCard } from './components/MetricCard'
import { TickerTape } from './components/TickerTape'
import { TradeTable } from './components/TradeTable'
import { clearAuthSession, getAuthUser, getUserDisplayName, setAuthSession } from './auth'
import { login, register } from './api/authApi'
import { cancelTrade, createTrade, updateTrade } from './api/tradeApi'
import { useTrades } from './hooks/useTrades'
import { tradeFormDefaults, tradeFormSchema, type TradeFormValues } from './schemas/trade'
import type { Trade, TradeSide, TradeStatus } from './types/trade'
import { emptyDraft, formatCurrency, formatMetric } from './utils/trade-utils'

type AuthSubmitPayload = {
  email: string
  password: string
  firstName?: string
  lastName?: string
  traderId?: string
  desk?: string
}

function App() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(getAuthUser())
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthUser()))

  const {
    trades,
    setTrades,
    summary,
    // simulateFeed,
    // setSimulateFeed,
    lastUpdated,
    flashTradeId,
    flashTone,
    isSocketConnected,
    triggerFlash,
  } = useTrades()

  const [search, setSearch] = useState('')
  const [sideFilter, setSideFilter] = useState<'ALL' | TradeSide>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | TradeStatus>('ALL')
  const [sortKey, setSortKey] = useState<'timestamp' | 'symbol' | 'notional'>('timestamp')
  const [draft, setDraft] = useState<Partial<Trade>>(emptyDraft)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const tradeForm = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    mode: 'onChange',
    defaultValues: tradeFormDefaults,
  })

  const handleTradeSubmit = async (values: TradeFormValues) => {
    await handleSaveTrade(values)
  }

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

      const user = {
        id: result.user?.id ?? payload.email,
        email: result.user?.email ?? payload.email,
        firstName: result.user?.firstName ?? payload.firstName,
        lastName: result.user?.lastName ?? payload.lastName,
        traderId: result.user?.traderId ?? payload.traderId,
        desk: result.user?.desk ?? payload.desk,
      }

      localStorage.removeItem('trading-desk-auth-message')
      setAuthSession(result.access_token, user)
      setCurrentUser(user)
      setIsAuthenticated(true)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed')
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

  const filteredTrades = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return [...trades]
      .filter((trade) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          trade.symbol.toLowerCase().includes(normalizedSearch) ||
          trade.counterparty.toLowerCase().includes(normalizedSearch) ||
          trade.trader.toLowerCase().includes(normalizedSearch) ||
          trade.id.toLowerCase().includes(normalizedSearch)

        const matchesSide = sideFilter === 'ALL' || trade.side === sideFilter
        const matchesStatus = statusFilter === 'ALL' || trade.status === statusFilter

        return matchesSearch && matchesSide && matchesStatus
      })
      .sort((a, b) => {
        if (sortKey === 'symbol') {
          return a.symbol.localeCompare(b.symbol) || b.tradeDate.localeCompare(a.tradeDate)
        }

        if (sortKey === 'notional') {
          return b.quantity * b.price - a.quantity * a.price
        }

        return new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()
      })
  }, [search, sideFilter, statusFilter, sortKey, trades])

  const openCreateForm = () => {
    setDraft({ ...emptyDraft, tradeDate: new Date().toISOString() })
    tradeForm.reset({ ...tradeFormDefaults, tradeDate: new Date().toISOString() })
    setIsEditing(false)
    setIsFormOpen(true)
  }

  const openEditForm = (trade: Trade) => {
    setDraft({ ...trade })
    tradeForm.reset({
      symbol: trade.symbol,
      side: trade.side,
      status: trade.status,
      quantity: Number(trade.quantity),
      price: Number(trade.price),
      trader: trade.trader,
      book: trade.book,
      counterparty: trade.counterparty,
      tradeDate: trade.tradeDate,
    })
    setIsEditing(true)
    setIsFormOpen(true)
  }

  const handleSaveTrade = async (values: TradeFormValues) => {
    const nextTrade: Trade = {
      id: draft.id ?? '',
      symbol: values.symbol.toUpperCase(),
      quantity: Number(values.quantity),
      price: Number(values.price),
      side: values.side,
      trader: values.trader.toUpperCase(),
      book: values.book.toUpperCase(),
      counterparty: values.counterparty,
      tradeDate: new Date(values.tradeDate).toISOString(),
      status: values.status,
    }

    if (isEditing) {
      setTrades((current) => current.map((trade) => (trade.id === nextTrade.id ? nextTrade : trade)))
      triggerFlash(nextTrade.id, 'amber')
    }

    try {
      const { id: _, ...payloadWithoutId } = nextTrade
      let updated: Trade

      if (isEditing) {
        updated = await updateTrade(String(draft.id ?? ''), payloadWithoutId)
        if (updated) {
          setTrades((current) => current.map((trade) => (trade.id === updated.id ? updated : trade)))
        }
      } else {
        updated = await createTrade(payloadWithoutId)
      }
    } catch {
      // backend fallback path intentionally left quiet while local dev is warm
    }

    setIsFormOpen(false)
  }

  const handleCancelTrade = async (id: string) => {
    setTrades((current) => current.map((trade) => (trade.id === id ? { ...trade, status: 'CANCELLED' } : trade)))
    triggerFlash(id, 'sell')

    try {
      const updated = await cancelTrade(id)
      if (updated) {
        setTrades((current) => current.map((trade) => (trade.id === updated.id ? updated : trade)))
      }
    } catch {
      // fallback for offline/local-only behavior
    }
  }

  if (!isAuthenticated) {
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
            onSubmit={handleAuthSubmit}
            isSubmitting={isSubmitting}
            error={authError}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="desk-shell">
      <header className="desk-header panel">
        <div className="top-bar">
          <div className="brand-wrap">
            <div className="brand-mark mono">B</div>
            <div>
              <div className="brand-title mono">BLOTTER</div>
              <div className="brand-subtitle mono">EQUITIES DESK • CASH DESK 4</div>
            </div>
          </div>

          <div className="header-meta">
            <div className={`live-status mono ${isSocketConnected ? 'connected' : 'disconnected'}`}>
              <span className={`pulse-dot ${isSocketConnected ? 'connected' : 'disconnected'}`} aria-hidden="true" />
              {isSocketConnected ? 'LIVE FEED CONNECTED' : 'LIVE FEED DISCONNECTED'}
            </div>
            <div className="clock mono">{new Date().toLocaleTimeString('en-US')}</div>
            <div className="user-badge mono">
              <span className="user-pill">{getUserDisplayName(currentUser).slice(0, 2).toUpperCase()}</span>
              <span>{getUserDisplayName(currentUser).toUpperCase()}</span>
              <button type="button" className="logout-btn mono" onClick={handleLogout}>
                LOGOUT
              </button>
            </div>
          </div>
        </div>

        <TickerTape trades={trades} />
      </header>

      <main className="desk-main">
        <section className="kpi-grid">
          <MetricCard label="ACTIVE TRADES" value={String(summary.active)} tone="neutral" />
          <MetricCard label="CANCELLED" value={String(summary.cancelled)} tone="muted" />
          <MetricCard label="BUY VOL" value={formatMetric(summary.buyVolume)} tone="buy" />
          <MetricCard label="SELL VOL" value={formatMetric(summary.sellVolume)} tone="sell" />
          <MetricCard label="GROSS NOTIONAL" value={formatCurrency(summary.notional)} tone="neutral" />
          <MetricCard label="LAST UPDATE" value={lastUpdated} tone="muted" />
        </section>

        <section className="toolbar panel">
          <div className="toolbar-row toolbar-primary">
            <div className="filter-group">
              <FilterButton active={sideFilter === 'ALL'} onClick={() => setSideFilter('ALL')}>
                ALL SIDES
              </FilterButton>
              <FilterButton active={sideFilter === 'BUY'} onClick={() => setSideFilter('BUY')}>
                BUY
              </FilterButton>
              <FilterButton active={sideFilter === 'SELL'} onClick={() => setSideFilter('SELL')}>
                SELL
              </FilterButton>
            </div>

            <div className="filter-group">
              <FilterButton active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')}>
                ALL STATUS
              </FilterButton>
              <FilterButton active={statusFilter === 'ACTIVE'} onClick={() => setStatusFilter('ACTIVE')}>
                ACTIVE
              </FilterButton>
              <FilterButton active={statusFilter === 'CANCELLED'} onClick={() => setStatusFilter('CANCELLED')}>
                CANCELLED
              </FilterButton>
            </div>

            <label className="sort-wrap mono">
              <span>SORT</span>
              <select
                aria-label="Sort trades"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as 'timestamp' | 'symbol' | 'notional')}
              >
                <option value="timestamp">TIME</option>
                <option value="notional">NOTIONAL</option>
                <option value="symbol">SYMBOL</option>
              </select>
            </label>
          </div>

          <div className="toolbar-row toolbar-secondary">
            <label className="search-wrap mono">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="SEARCH SYMBOL, ID, TRADER, COUNTERPARTY"
              />
            </label>

            {/* <label className="toggle-wrap mono">
              <input type="checkbox" checked={simulateFeed} onChange={() => setSimulateFeed((value) => !value)} />
              <span>SIMULATE FEED</span>
            </label> */}

            <button type="button" className="primary-btn mono" onClick={openCreateForm}>
              + NEW TRADE
            </button>
          </div>
        </section>

        <section>
          <TradeTable
            trades={filteredTrades}
            flashTradeId={flashTradeId}
            flashTone={flashTone}
            onAmend={openEditForm}
            onCancel={handleCancelTrade}
          />
        </section>
      </main>

      {isFormOpen && (
        <div className="drawer-backdrop" onClick={() => setIsFormOpen(false)} aria-label="Close trade form" />
      )}
      <aside className={`trade-drawer panel ${isFormOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="mono">{isEditing ? 'AMEND TRADE' : 'NEW TRADE'}</h2>
          <button type="button" className="close-btn" onClick={() => setIsFormOpen(false)}>
            ×
          </button>
        </div>

        <form className="drawer-form" onSubmit={tradeForm.handleSubmit(handleTradeSubmit)} noValidate>
          <label className="field mono">
            <span>SYMBOL *</span>
            <input
              {...tradeForm.register('symbol')}
              placeholder="AAPL"
            />
            {tradeForm.formState.errors.symbol ? (
              <small className="field-error">{tradeForm.formState.errors.symbol.message}</small>
            ) : null}
          </label>

          <div className="field-row">
            <label className="field mono">
              <span>SIDE *</span>
              <select {...tradeForm.register('side')}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
              {tradeForm.formState.errors.side ? (
                <small className="field-error">{tradeForm.formState.errors.side.message}</small>
              ) : null}
            </label>

            <label className="field mono">
              <span>STATUS</span>
              <select {...tradeForm.register('status')}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              {tradeForm.formState.errors.status ? (
                <small className="field-error">{tradeForm.formState.errors.status.message}</small>
              ) : null}
            </label>
          </div>

          <div className="field-row">
            <label className="field mono">
              <span>QUANTITY *</span>
              <input
                type="number"
                min="1"
                {...tradeForm.register('quantity', { valueAsNumber: true })}
              />
              {tradeForm.formState.errors.quantity ? (
                <small className="field-error">{tradeForm.formState.errors.quantity.message}</small>
              ) : null}
            </label>

            <label className="field mono">
              <span>PRICE (USD) *</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                {...tradeForm.register('price', { valueAsNumber: true })}
              />
              {tradeForm.formState.errors.price ? (
                <small className="field-error">{tradeForm.formState.errors.price.message}</small>
              ) : null}
            </label>
          </div>

          <label className="field mono">
            <span>TRADER *</span>
            <input {...tradeForm.register('trader')} placeholder="CYRUS" />
            {tradeForm.formState.errors.trader ? (
              <small className="field-error">{tradeForm.formState.errors.trader.message}</small>
            ) : null}
          </label>

          <div className="field-row">
            <label className="field mono">
              <span>BOOK</span>
              <input {...tradeForm.register('book')} placeholder="EQUITIES_US" />
              {tradeForm.formState.errors.book ? (
                <small className="field-error">{tradeForm.formState.errors.book.message}</small>
              ) : null}
            </label>

            <label className="field mono">
              <span>COUNTERPARTY</span>
              <input {...tradeForm.register('counterparty')} placeholder="Goldman Sachs" />
              {tradeForm.formState.errors.counterparty ? (
                <small className="field-error">{tradeForm.formState.errors.counterparty.message}</small>
              ) : null}
            </label>
          </div>

          <label className="field mono">
            <span>TRADE DATE / TIME</span>
            <input
              type="datetime-local"
              {...tradeForm.register('tradeDate', {
                setValueAs: (value) => (value ? new Date(value).toISOString() : value),
              })}
            />
            {tradeForm.formState.errors.tradeDate ? (
              <small className="field-error">{tradeForm.formState.errors.tradeDate.message}</small>
            ) : null}
          </label>

          <div className="drawer-actions">
            <button type="button" className="secondary-btn mono" onClick={() => setIsFormOpen(false)}>
              DISCARD
            </button>
            <button type="submit" className="primary-btn mono" disabled={tradeForm.formState.isSubmitting}>
              {isEditing ? 'SAVE AMENDMENT' : 'BOOK TRADE'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

export default App
