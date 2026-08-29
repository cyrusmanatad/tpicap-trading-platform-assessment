import { useMemo, useState } from 'react'
import './App.css'
import { FilterButton } from './components/FilterButton'
import { MetricCard } from './components/MetricCard'
import { TickerTape } from './components/TickerTape'
import { useTrades } from './hooks/useTrades'
import type { Trade, TradeSide, TradeStatus } from './types/trade'
import { emptyDraft, formatCurrency, formatMetric } from './utils/trade-utils'

function App() {
  const {
    trades,
    setTrades,
    summary,
    simulateFeed,
    setSimulateFeed,
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
    setIsEditing(false)
    setIsFormOpen(true)
  }

  const openEditForm = (trade: Trade) => {
    setDraft({ ...trade })
    setIsEditing(true)
    setIsFormOpen(true)
  }

  const handleSaveTrade = async () => {
    const nextTrade: Trade = {
      id: draft.id ?? `TRD-${Math.floor(Math.random() * 9000 + 1000)}`,
      symbol: String(draft.symbol ?? '').toUpperCase(),
      quantity: Number(draft.quantity ?? 0),
      price: Number(draft.price ?? 0),
      side: (draft.side ?? 'BUY') as TradeSide,
      trader: String(draft.trader ?? 'Unassigned').toUpperCase(),
      book: String(draft.book ?? 'EQ-NA').toUpperCase(),
      counterparty: String(draft.counterparty ?? 'Unknown'),
      tradeDate: draft.tradeDate ?? new Date().toISOString(),
      status: (draft.status ?? 'ACTIVE') as TradeStatus,
    }

    if (isEditing) {
      setTrades((current) => current.map((trade) => (trade.id === nextTrade.id ? nextTrade : trade)))
      triggerFlash(nextTrade.id, 'amber')
    } else {
      setTrades((current) => [nextTrade, ...current])
      triggerFlash(nextTrade.id, nextTrade.side === 'BUY' ? 'buy' : 'sell')
    }

    try {
      const response = await fetch('/api/trades' + (isEditing ? `/${draft.id}` : ''), {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nextTrade,
          ...(isEditing ? {} : { id: nextTrade.id }),
        }),
      })

      if (response.ok) {
        const updated = (await response.json()) as Trade
        if (updated) {
          setTrades((current) => current.map((trade) => (trade.id === updated.id ? updated : trade)))
        }
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
      const response = await fetch(`/api/trades/${id}/cancel`, { method: 'PATCH' })
      if (response.ok) {
        const updated = (await response.json()) as Trade
        if (updated) {
          setTrades((current) => current.map((trade) => (trade.id === updated.id ? updated : trade)))
        }
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
              <span className="user-pill">JS</span>
              J. SMITH
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

            <label className="toggle-wrap mono">
              <input type="checkbox" checked={simulateFeed} onChange={() => setSimulateFeed((value) => !value)} />
              <span>SIMULATE FEED</span>
            </label>

            <button type="button" className="primary-btn mono" onClick={openCreateForm}>
              + NEW TRADE
            </button>
          </div>
        </section>

        <section className="table-panel panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {['TRADE ID', 'TIME', 'SYMBOL', 'SIDE', 'QTY', 'PRICE', 'NOTIONAL', 'TRADER', 'BOOK', 'COUNTERPARTY', 'STATUS', 'ACTIONS'].map((heading) => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => {
                  const isCancelled = trade.status === 'CANCELLED'
                  const rowTone = flashTradeId === trade.id ? `flash-${flashTone ?? 'buy'}` : ''

                  return (
                    <tr key={trade.id} className={`${rowTone} ${isCancelled ? 'row-cancelled' : ''}`}>
                      <td className="mono muted">{trade.id}</td>
                      <td className="mono muted">{new Date(trade.tradeDate).toLocaleTimeString('en-US')}</td>
                      <td className="symbol-cell">{trade.symbol}</td>
                      <td>
                        <span className={`side-badge ${trade.side === 'BUY' ? 'side-buy' : 'side-sell'}`}>
                          {trade.side === 'BUY' ? '▲ BUY' : '▼ SELL'}
                        </span>
                      </td>
                      <td className="numeric right">{formatMetric(trade.quantity)}</td>
                      <td className="numeric right">{trade.price}</td>
                      <td className="numeric right">{formatCurrency(trade.quantity * trade.price)}</td>
                      <td>{trade.trader}</td>
                      <td className="muted">{trade.book}</td>
                      <td className="muted">{trade.counterparty}</td>
                      <td>
                        <span className={`status-pill ${trade.status === 'ACTIVE' ? 'status-active' : 'status-cancelled'}`}>
                          {trade.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button type="button" className="action-btn amend-btn" onClick={() => openEditForm(trade)}>
                            AMEND
                          </button>
                          <button
                            type="button"
                            className="action-btn cancel-btn"
                            disabled={trade.status === 'CANCELLED'}
                            onClick={() => handleCancelTrade(trade.id)}
                          >
                            CANCEL
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="table-footer mono">
            <span>{filteredTrades.length} trades shown</span>
            <span>SETTLEMENT: T+1 • DESK: EQUITIES_US/UK</span>
          </div>
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

        <div className="drawer-form">
          <label className="field mono">
            <span>SYMBOL *</span>
            <input
              value={draft.symbol ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, symbol: event.target.value }))}
              placeholder="AAPL"
            />
          </label>

          <div className="field-row">
            <label className="field mono">
              <span>SIDE *</span>
              <select
                value={draft.side ?? 'BUY'}
                onChange={(event) => setDraft((current) => ({ ...current, side: event.target.value as TradeSide }))}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </label>

            <label className="field mono">
              <span>STATUS</span>
              <select
                value={draft.status ?? 'ACTIVE'}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as TradeStatus }))}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field mono">
              <span>QUANTITY *</span>
              <input
                type="number"
                min="1"
                value={draft.quantity ?? 0}
                onChange={(event) => setDraft((current) => ({ ...current, quantity: Number(event.target.value) }))}
              />
            </label>

            <label className="field mono">
              <span>PRICE (USD) *</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={draft.price ?? 0}
                onChange={(event) => setDraft((current) => ({ ...current, price: Number(event.target.value) }))}
              />
            </label>
          </div>

          <label className="field mono">
            <span>TRADER *</span>
            <input
              value={draft.trader ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, trader: event.target.value }))}
              placeholder="JSMITH"
            />
          </label>

          <div className="field-row">
            <label className="field mono">
              <span>BOOK</span>
              <input
                value={draft.book ?? 'EQ-NA'}
                onChange={(event) => setDraft((current) => ({ ...current, book: event.target.value }))}
                placeholder="EQUITIES_US"
              />
            </label>

            <label className="field mono">
              <span>COUNTERPARTY</span>
              <input
                value={draft.counterparty ?? ''}
                onChange={(event) => setDraft((current) => ({ ...current, counterparty: event.target.value }))}
                placeholder="Goldman Sachs"
              />
            </label>
          </div>

          <label className="field mono">
            <span>TRADE DATE / TIME</span>
            <input
              type="datetime-local"
              value={new Date(draft.tradeDate ?? new Date().toISOString()).toISOString().slice(0, 16)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  tradeDate: new Date(event.target.value).toISOString(),
                }))
              }
            />
          </label>
        </div>

        <div className="drawer-actions">
          <button type="button" className="secondary-btn mono" onClick={() => setIsFormOpen(false)}>
            DISCARD
          </button>
          <button type="button" className="primary-btn mono" onClick={handleSaveTrade}>
            {isEditing ? 'SAVE AMENDMENT' : 'BOOK TRADE'}
          </button>
        </div>
      </aside>
    </div>
  )
}

export default App
