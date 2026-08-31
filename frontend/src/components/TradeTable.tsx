import type { Trade } from '../types/trade';
import { formatCurrency, formatMetric } from '../utils/trade-utils';

interface TradeTableProps {
  trades: Trade[];
  flashTradeId: string | null;
  flashTone: 'buy' | 'sell' | 'amber' | null;
  onAmend: (trade: Trade) => void;
  onCancel: (id: string) => void;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (pageIndex: number) => void;
}

export function TradeTable({
  trades,
  flashTradeId,
  flashTone,
  onAmend,
  onCancel,
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
}: TradeTableProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(pageIndex + 1, pageCount);

  return (
    <div className="table-panel panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>TRADE ID</th>
              <th>TIME</th>
              <th>SYMBOL</th>
              <th>SIDE</th>
              <th>QTY</th>
              <th>PRICE</th>
              <th>NOTIONAL</th>
              <th>TRADER</th>
              <th>BOOK</th>
              <th>COUNTERPARTY</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {trades.map((trade) => {
              const isCancelled = trade.status === 'CANCELLED';
              const rowTone = flashTradeId === trade.id ? `flash-${flashTone ?? 'buy'}` : '';

              return (
                <tr key={trade.id} className={`${rowTone} ${isCancelled ? 'row-cancelled' : ''}`}>
                  <td><span className="mono muted">{trade.id}</span></td>
                  <td><span className="mono muted">{new Date(trade.tradeDate).toLocaleTimeString('en-US')}</span></td>
                  <td><span className="symbol-cell">{trade.symbol}</span></td>
                  <td>
                    <span className={`side-badge ${trade.side === 'BUY' ? 'side-buy' : 'side-sell'}`}>
                      {trade.side === 'BUY' ? '▲ BUY' : '▼ SELL'}
                    </span>
                  </td>
                  <td><span className="numeric right">{formatMetric(trade.quantity)}</span></td>
                  <td><span className="numeric right">{trade.price}</span></td>
                  <td><span className="numeric right">{formatCurrency(trade.quantity * trade.price)}</span></td>
                  <td>{trade.trader}</td>
                  <td><span className="muted">{trade.book}</span></td>
                  <td><span className="muted">{trade.counterparty}</span></td>
                  <td>
                    <span className={`status-pill ${trade.status === 'ACTIVE' ? 'status-active' : 'status-cancelled'}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button type="button" className="action-btn amend-btn" onClick={() => onAmend(trade)}>
                        AMEND
                      </button>
                      <button
                        type="button"
                        className="action-btn cancel-btn"
                        disabled={trade.status === 'CANCELLED'}
                        onClick={() => onCancel(trade.id)}
                      >
                        CANCEL
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer mono">
        <span>
          {totalCount} trades total • page {currentPage} / {pageCount}
        </span>
        <div className="table-pagination">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
          >
            PREV
          </button>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(Math.min(pageCount - 1, pageIndex + 1))}
            disabled={pageIndex >= pageCount - 1}
          >
            NEXT
          </button>
        </div>
        <span>SETTLEMENT: T+1 • DESK: EQUITIES_US/UK</span>
      </div>
    </div>
  );
}
