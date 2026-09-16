import { useEffect, useState } from 'react';
import { getTradeHistory } from '../api/tradeApi';
import type { TradeHistoryAction, TradeHistoryEntry } from '../types/trade';

const ACTION_LABEL: Record<TradeHistoryAction, string> = {
  CREATED: 'BOOKED',
  UPDATED: 'AMENDED',
  CANCELLED: 'CANCELLED',
};

const FIELD_LABEL: Record<string, string> = {
  symbol: 'SYMBOL',
  side: 'SIDE',
  status: 'STATUS',
  quantity: 'QTY',
  price: 'PRICE',
  trader: 'TRADER',
  book: 'BOOK',
  counterparty: 'COUNTERPARTY',
  tradeDate: 'TRADE DATE',
};

function formatChangeValue(field: string, value: string | number | null): string | null {
  if (value == null) {
    return null;
  }

  if (field === 'tradeDate') {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString('en-US');
  }

  return String(value);
}

function formatChangeLine(field: string, from: string | number | null, to: string | number | null): string {
  const label = FIELD_LABEL[field] ?? field.toUpperCase();
  const fromText = formatChangeValue(field, from);
  const toText = formatChangeValue(field, to);

  if (fromText == null && toText != null) {
    return `${label} ${toText}`;
  }

  if (fromText != null && toText != null) {
    return `${label} ${fromText} -> ${toText}`;
  }

  if (fromText != null) {
    return `${label} ${fromText}`;
  }

  return label;
}

interface TradeHistoryDrawerProps {
  tradeId: string | null;
  onClose: () => void;
}

export function TradeHistoryDrawer({ tradeId, onClose }: TradeHistoryDrawerProps) {
  const isOpen = Boolean(tradeId);
  const [entries, setEntries] = useState<TradeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await getTradeHistory(id);
      setEntries(history);
    } catch {
      setEntries([]);
      setError('Could not load history for this trade.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!tradeId) {
      setEntries([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    void loadHistory(tradeId);
  }, [tradeId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen ? (
        <div className="drawer-backdrop" onClick={onClose} aria-label="Close trade history" />
      ) : null}
      <aside
        className={`trade-drawer panel ${isOpen ? 'open' : ''}`}
        aria-labelledby="trade-history-title"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="drawer-header">
          <div>
            <h2 id="trade-history-title" className="mono">TRADE HISTORY</h2>
            {tradeId ? <p className="history-trade-id mono">TRADE {tradeId}</p> : null}
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close trade history">
            ×
          </button>
        </div>

        <div className="history-body">
          {isLoading ? (
            <p className="history-state mono">Loading history...</p>
          ) : null}

          {!isLoading && error ? (
            <div className="history-state">
              <p className="mono">{error}</p>
              {tradeId ? (
                <button type="button" className="secondary-btn mono" onClick={() => void loadHistory(tradeId)}>
                  RETRY
                </button>
              ) : null}
            </div>
          ) : null}

          {!isLoading && !error && entries.length === 0 ? (
            <p className="history-state mono">No changes recorded for this trade.</p>
          ) : null}

          {!isLoading && !error && entries.length > 0 ? (
            <ol className="history-list">
              {entries.map((entry) => (
                <li key={entry.id} className="history-entry">
                  <div className="history-entry-meta">
                    <span className={`history-action history-action-${entry.action.toLowerCase()} mono`}>
                      {ACTION_LABEL[entry.action]}
                    </span>
                    <time className="history-time mono" dateTime={entry.createdAt}>
                      {new Date(entry.createdAt).toLocaleString('en-US')}
                    </time>
                  </div>
                  <p className="history-actor">{entry.actorName}</p>
                  <p className="history-email mono">{entry.actorEmail}</p>
                  <ul className="history-changes">
                    {Object.entries(entry.changes).map(([field, change]) => (
                      <li key={field} className="mono">
                        {formatChangeLine(field, change.from, change.to)}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </aside>
    </>
  );
}
