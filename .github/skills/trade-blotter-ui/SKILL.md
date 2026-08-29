---
name: trade-blotter-ui
description: "Build and refine trade blotter UIs in React + TypeScript + Tailwind CSS. Use for broker/trading dashboards, trade tables, create-amend-cancel workflows, filters, and real-time status updates."
argument-hint: "Create a trade blotter screen with table, filters, create form, and live status updates"
user-invocable: true
disable-model-invocation: false
---

# Trade Blotter UI

## When to use
- Creating or revising a trade blotter or trading dashboard interface
- Implementing UI for viewing, creating, amending, and cancelling equity trades
- Designing data-dense tables and form flows with React, TypeScript, and Tailwind CSS
- Building status, real-time alert, and broker-style portfolio screens

## Product context
This project is a simplified trading platform for a broker. The UI should help users manage a real-time trade blotter for equity trades, with clear operational state and fast decision-making.

Primary user goals:
- View trades in a fast, scannable table
- Create new trades
- Amend trade details
- Cancel trades
- See updates reflected immediately in the UI

Core trade model:

```ts
interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  side: "BUY" | "SELL";
  trader: string;
  tradeDate: string;
  status: "ACTIVE" | "CANCELLED";
}
```

Sample financial data should be presented clearly, including:
- trade ID
- symbol
- side
- quantity
- price
- trader
- book
- counterparty
- timestamp
- status

## Design goals
1. Prioritize readability over decoration: the user should scan trades quickly.
2. Keep the blotter dense and operational, not visually noisy.
3. Use strong status signals for ACTIVE vs CANCELLED trades.
4. Make trade actions obvious and low-friction.
5. Ensure the layout works across desktop and tablet widths.
6. Treat the trade table as a real-time operational dashboard, not a generic dashboard card.

## Reference UI direction
Use the supplied reference as the visual baseline for the trading desk experience. The design language should feel like a live, dark-mode execution screen rather than a generic SaaS dashboard.

### Visual system
- Use a dark charcoaled palette with near-black backgrounds, slate panels, subtle borders, and cool blue action accents.
- Keep the shell structured and operational: header, ticker ribbon, KPI strip, filters, and dense table body.
- Use a monospaced, terminal-like font for IDs, timestamps, and trading metrics to emphasize desk workflow.
- Keep surfaces layered with low-contrast panel borders, with just enough elevation to separate function areas.
- Use green for BUY and red/pink for SELL to reinforce execution direction at a glance.
- Use soft amber accents for amend activities and warning states.

### Layout pattern
Mirror the reference composition:
- top bar with desk branding and live feed status
- ticker tape across the page for live market movement and trade highlights
- KPI strip showing trade counts, volumes, notional, and last update
- compact controls row with search, filters, and a primary action button
- large, high-density table with sticky headers and narrow row spacing
- right-side slide-over form for new or amended trades
- confirmation modal for cancellation actions
- toast notifications for booking, amend, and cancel events

### Component styling cues
- Panels: dark neutral background, thin borders, rounded corners, restrained shadowing
- Buttons: primary action uses a blue accent; secondary ghost buttons use neutral borders; amend uses amber; cancel uses danger red styling
- Status pills: active trades should be high-contrast, while cancelled trades appear muted or struck-through
- Row states: use subtle live flash animation for updated or newly inserted trades, but keep it subtle and professionallooking
- Numeric fields: right-aligned, monospace, and clearly separated from text values

### Behavioral styling
- Show a live connection indicator in the header and update timestamps in real time
- Use a quick ticker feed to reinforce the live desk feel
- Apply row flash animation to newly created, amended, or highlighted trades without excessive noise
- Keep filters compact and keyboard-friendly to support a busy trader workflow

## Workflow

### 1. Establish the screen structure
Start by defining a clear top-level layout:
- header with title, search, filters, and action buttons
- summary metrics row for key values (count, notional, active trades, cancelled trades)
- primary blotter table
- optional side panel or drawer for create/amend trade actions

Suggested layout pattern:
- max-width container
- sticky top bar
- subtle surface cards with soft borders and shadows
- table rows with hover states and clear column alignment

### 2. Model the trade table as a high-density data grid
Use a table with consistent columns and compact spacing. Aim for quick scanning and minimal visual clutter.

Recommended columns:
- Trade ID
- Symbol
- Side
- Quantity
- Price
- Notional
- Trader
- Book
- Counterparty
- Timestamp
- Status
- Actions

UI details:
- align numeric data right
- style BUY as green and SELL as red or blue depending on design system
- show status with pill badges such as ACTIVE / CANCELLED
- highlight row on hover and when selected
- treat the row as actionable for quick detail viewing

### 3. Add filters and controls before building dense UI complexity
Common blotter controls:
- search by symbol or counterparty
- filter by side
- filter by status
- filter by trader or book
- sort by timestamp or notional
- quick action buttons like New Trade and Refresh

Keep controls visible and compact. Avoid overloading the page with too many controls before core functionality is working.

### 4. Design the create, amend, and cancel flows
The UI should support four core actions:
- View trades
- Create trades
- Amend trades
- Cancel trades

Preferred interaction patterns:
- New Trade opens a modal or slide-over form
- Edit action opens a prefilled form for the selected row
- Cancel action uses a confirm pattern with clear risk messaging
- status transitions update in-place with visual feedback

Form design rules:
- fields should be grouped logically: trade details, execution details, counterparty, operational metadata
- use validation states for required fields
- show large CTA buttons with clear destructive styling for cancel actions
- keep form actions anchored at the bottom of the drawer or modal

### 5. Treat real-time updates as a first-class UX requirement
Real-time behavior should feel immediate and trustworthy.

Implementation expectations:
- status chips update immediately after a change
- newly created trades appear in the table without page reload
- cancelled rows move to cancelled state with updated badge styling
- changed rows should preserve the current sort/filter state when possible
- use subtle animation or flash state for updated rows, but keep it restrained

### 6. State and component patterns
Prefer small, reusable components that map directly to trading operations.

Component set to consider:
- `TradeBlotterPage`
- `BlotterHeader`
- `TradeFilters`
- `TradeTable`
- `TradeRow`
- `StatusBadge`
- `TradeFormModal`
- `TradeDetailDrawer`
- `ActionMenu` or `RowActions`
- `SummaryCard`

State recommendations:
- keep trade list in a single source of truth
- derive filtered rows from current search and filters
- use optimistic UI for rapid local updates when appropriate
- keep row selection separate from editing state to prevent UI confusion

### 7. Maintain strong accessibility and clarity
Trade blotter interfaces must be immediate and operable without guesswork.

Checklist:
- every visible action has a clear label
- form inputs have labels and error text
- color is not the only status indicator
- keyboard navigation works for filters, rows, actions, and modals
- focus remains visible when a modal or drawer opens
- action buttons are not visually ambiguous between primary and destructive states

### 8. Validate against UX quality criteria
Before finishing a blotter implementation, confirm all of the following:
- Users can scan the trade list without needing to decode layout
- Status changes are visible immediately
- Create/edit/cancel actions are obvious and reliable
- The table remains readable at desktop and tablet sizes
- Filters and sorting improve usability rather than adding clutter
- Visual hierarchy communicates urgency and operational importance without being noisy

## Technical implementation guidance
Use React + TypeScript + Tailwind CSS with strong component boundaries and explicit UI state management.

Recommended patterns:
- create typed data models for `Trade`, `TradeStatus`, and action payloads
- use utility functions for formatting currency, quantities, and timestamps
- keep tailwind classes consistent with a design token approach
- prefer `data-*` attributes or semantic labeling for status/state logic
- avoid excessive custom CSS when Tailwind utility classes can express the layout clearly

Example UI tokens to shape decisions:
- subtle borders: `border-slate-200`
- neutral surface: `bg-slate-50` / `bg-white`
- success state: `text-emerald-600`, `bg-emerald-50`
- danger state: `text-rose-600`, `bg-rose-50`
- muted secondary text: `text-slate-500`

## Example screen composition
A strong initial version should include:
- page header with title and actions
- summary cards for active trades, cancelled trades, and notional
- filter row with search and side/status chips
- table with live rows and quick actions
- modal for create/edit trade
- confirmation flow for cancel trade
- row highlight or toast feedback after update

## Completion checklist
An implementation is ready when:
- the blotter displays real trades in a clean table
- users can create, amend, and cancel trades through visible actions
- status updates are reflected immediately in the UI
- the layout is functional and legible under operational conditions
- the UI is responsive and accessible enough for frequent trade desk use

## Output expectations
When asked to build this feature, produce:
1. a clear React + TypeScript screen layout
2. reusable Tailwind-styled components for the blotter and forms
3. real-time data update behavior that matches operational trading workflows
4. polished status and action states for ACTIVE vs CANCELLED trades
5. a usable, broker-style trading desk experience
