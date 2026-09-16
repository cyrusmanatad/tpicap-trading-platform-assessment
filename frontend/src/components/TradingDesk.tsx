import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FilterButton } from './FilterButton'
import { MetricCard } from './MetricCard'
import { TickerTape } from './TickerTape'
import { TradeHistoryDrawer } from './TradeHistoryDrawer'
import { TradeTable } from './TradeTable'
import { getUserDisplayName, type AuthUser } from '../auth'
import { cancelTrade, createTrade, updateTrade } from '../api/tradeApi'
import { useTrades } from '../hooks/useTrades'
import useDebounce from '../hooks/useDebounce'
import { tradeFormDefaults, tradeFormSchema, type TradeFormValues } from '../schemas/trade'
import type { Trade, TradeSide, TradeStatus } from '../types/trade'
import { emptyDraft, formatCurrency, formatMetric } from '../utils/trade-utils'

type TradingDeskProps = {
  currentUser: AuthUser | null
  onLogout: () => void
}

export function TradingDesk({ currentUser, onLogout }: TradingDeskProps) {
  const {
    trades,
    setTrades,
    summary,
    lastUpdated,
    flashTradeId,
    flashTone,
    isSocketConnected,
    triggerFlash,
    fetchTrades,
    isLoading,
    pageMeta,
  } = useTrades()

  const [search, setSearch] = useState('')
  const [sideFilter, setSideFilter] = useState<'ALL' | TradeSide>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | TradeStatus>('ALL')
  const [sortKey, setSortKey] = useState<'timestamp' | 'symbol' | 'notional'>('timestamp')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const debouncedSearch = useDebounce(search, 500)
  const [draft, setDraft] = useState<Partial<Trade>>(emptyDraft)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [historyTradeId, setHistoryTradeId] = useState<string | null>(null)
  const tradeForm = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    mode: 'onChange',
    defaultValues: tradeFormDefaults,
  })

  const handleTradeSubmit = async (values: TradeFormValues) => {
    await handleSaveTrade(values)
  }

  useEffect(() => {
    setPageIndex(0)
  }, [search, sideFilter, statusFilter, sortKey])

  useEffect(() => {
    void fetchTrades({
      search: debouncedSearch.trim() || undefined,
      side: sideFilter === 'ALL' ? undefined : sideFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      sort: sortKey,
      limit: pageSize,
      offset: pageIndex * pageSize,
    })
  }, [debouncedSearch, sideFilter, statusFilter, sortKey, pageIndex, pageSize, fetchTrades])

  const closeDrawers = () => {
    setIsFormOpen(false)
    setHistoryTradeId(null)
  }

  useEffect(() => {
    if (!isFormOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawers()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isFormOpen])

  const openCreateForm = () => {
    setHistoryTradeId(null)
    setDraft({ ...emptyDraft, tradeDate: new Date().toISOString() })
    tradeForm.reset({ ...tradeFormDefaults, tradeDate: new Date().toISOString() })
    setIsEditing(false)
    setIsFormOpen(true)
  }

  const openEditForm = (trade: Trade) => {
    setHistoryTradeId(null)
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

  const openHistory = (id: string) => {
    setIsFormOpen(false)
    setHistoryTradeId(id)
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
              <button type="button" className="logout-btn mono" onClick={onLogout}>
                LOGOUT
              </button>
            </div>
          </div>
        </div>

        <TickerTape trades={trades} isLoading={isLoading} />
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

            <label className="sort-wrap mono">
              <span>PAGE SIZE</span>
              <select
                aria-label="Page size"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
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

            <button type="button" className="primary-btn mono" onClick={openCreateForm}>
              + NEW TRADE
            </button>
          </div>
        </section>

        <section>
          <TradeTable
            trades={trades}
            isLoading={isLoading}
            flashTradeId={flashTradeId}
            flashTone={flashTone}
            onAmend={openEditForm}
            onCancel={handleCancelTrade}
            onHistory={openHistory}
            onNewTrade={openCreateForm}
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalCount={pageMeta.total}
            onPageChange={setPageIndex}
          />
        </section>
      </main>

      {isFormOpen && (
        <div className="drawer-backdrop" onClick={closeDrawers} aria-label="Close trade form" />
      )}
      <aside className={`trade-drawer panel ${isFormOpen ? 'open' : ''}`} inert={!isFormOpen}>
        <div className="drawer-header">
          <h2 className="mono">{isEditing ? 'AMEND TRADE' : 'NEW TRADE'}</h2>
          <button type="button" className="close-btn" onClick={closeDrawers} aria-label="Close trade form">
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
            <button type="button" className="secondary-btn mono" onClick={closeDrawers}>
              DISCARD
            </button>
            <button type="submit" className="primary-btn mono" disabled={tradeForm.formState.isSubmitting}>
              {isEditing ? 'SAVE AMENDMENT' : 'BOOK TRADE'}
            </button>
          </div>
        </form>
      </aside>

      <TradeHistoryDrawer tradeId={historyTradeId} onClose={closeDrawers} />
    </div>
  )
}
