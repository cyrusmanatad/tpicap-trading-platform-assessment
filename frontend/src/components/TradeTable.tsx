import { useState } from 'react';
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import type { Trade } from '../types/trade';
import { formatCurrency, formatMetric } from '../utils/trade-utils';

interface TradeTableProps {
  trades: Trade[];
  flashTradeId: string | null;
  flashTone: 'buy' | 'sell' | 'amber' | null;
  onAmend: (trade: Trade) => void;
  onCancel: (id: string) => void;
}

const features = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
const columnHelper = createColumnHelper<typeof features, Trade>();

export function TradeTable({ trades, flashTradeId, flashTone, onAmend, onCancel }: TradeTableProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns = columnHelper.columns([
    columnHelper.accessor('id', {
      header: 'TRADE ID',
      cell: (info) => <span className="mono muted">{info.getValue()}</span>,
    }),
    columnHelper.accessor('tradeDate', {
      header: 'TIME',
      cell: (info) => <span className="mono muted">{new Date(info.getValue()).toLocaleTimeString('en-US')}</span>,
    }),
    columnHelper.accessor('symbol', {
      header: 'SYMBOL',
      cell: (info) => <span className="symbol-cell">{info.getValue()}</span>,
    }),
    columnHelper.accessor('side', {
      header: 'SIDE',
      cell: (info) => (
        <span className={`side-badge ${info.getValue() === 'BUY' ? 'side-buy' : 'side-sell'}`}>
          {info.getValue() === 'BUY' ? '▲ BUY' : '▼ SELL'}
        </span>
      ),
    }),
    columnHelper.accessor('quantity', {
      header: 'QTY',
      cell: (info) => <span className="numeric right">{formatMetric(info.getValue())}</span>,
    }),
    columnHelper.accessor('price', {
      header: 'PRICE',
      cell: (info) => <span className="numeric right">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'notional',
      header: 'NOTIONAL',
      cell: ({ row }) => <span className="numeric right">{formatCurrency(row.original.quantity * row.original.price)}</span>,
    }),
    columnHelper.accessor('trader', {
      header: 'TRADER',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('book', {
      header: 'BOOK',
      cell: (info) => <span className="muted">{info.getValue()}</span>,
    }),
    columnHelper.accessor('counterparty', {
      header: 'COUNTERPARTY',
      cell: (info) => <span className="muted">{info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'STATUS',
      cell: (info) => (
        <span className={`status-pill ${info.getValue() === 'ACTIVE' ? 'status-active' : 'status-cancelled'}`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="action-group">
          <button type="button" className="action-btn amend-btn" onClick={() => onAmend(row.original)}>
            AMEND
          </button>
          <button
            type="button"
            className="action-btn cancel-btn"
            disabled={row.original.status === 'CANCELLED'}
            onClick={() => onCancel(row.original.id)}
          >
            CANCEL
          </button>
        </div>
      ),
    }),
  ]);

  const table = useTable({
    features,
    columns,
    data: trades,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;

  return (
    <div className="table-panel panel">
      <div className="table-scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isCancelled = row.original.status === 'CANCELLED';
              const rowTone = flashTradeId === row.original.id ? `flash-${flashTone ?? 'buy'}` : '';

              return (
                <tr key={row.id} className={`${rowTone} ${isCancelled ? 'row-cancelled' : ''}`}>
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer mono">
        <span>
          {trades.length} trades shown • page {currentPage} / {pageCount || 1}
        </span>
        <div className="table-pagination">
          <button type="button" className="pagination-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            PREV
          </button>
          <button type="button" className="pagination-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            NEXT
          </button>
        </div>
        <span>SETTLEMENT: T+1 • DESK: EQUITIES_US/UK</span>
      </div>
    </div>
  );
}
