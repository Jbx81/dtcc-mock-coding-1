# Digital Asset Transactions Dashboard

React + TypeScript implementation of a reusable transaction table built for DTCC's Digital Assets interview exercise.

## Getting started

```bash
npm install
npm run dev
```

The development server runs on port 5173. By default the app fetches from `public/transactions.json`; point `VITE_TRANSACTIONS_API` at a real REST endpoint to integrate with live data.

### Tests

```bash
npm test
```

Jest + React Testing Library cover reducer-style sorting/filtering logic and the table’s primary interaction flows (loading, filtering, error recovery).

## Solution highlights

- **State + data layer** – `TransactionsProvider` handles fetching, error/loading coordination, and exposes memoised selectors plus helpers for sorting, filtering, pagination, and refetching.
- **Reusable table** – `TransactionsTable` composes a column definition model, accessible sort controls, toolbar filters (status, asset, free-text search), and paging controls suitable for larger datasets.
- **Resilience** – errors surface in-line with retry affordances; fetches use `AbortController` for fast refresh scenarios.
- **Performance** – pagination keeps the DOM footprint small while still allowing quick navigation; the provider can expand smaller payloads for stress testing and can be swapped for virtual scrolling later.
- **Styling** – responsive layout + custom CSS (no frameworks) to highlight design considerations without adding setup overhead.

## Next steps

- Wire the API layer to DTCC’s real service (auth, retries, metrics).
- Externalise column and filter configuration for per-desk custom views.
- Add optimistic UI updates for trade status changes or acknowledgements.
- Replace pagination with windowed rendering (`react-window`) when row counts exceed thousands.
