import type { TransactionFilters } from '@/types/transaction'

import { PAGE_SIZE_OPTIONS } from '@/context/TransactionsContext'

interface TransactionsToolbarProps {
  filters: TransactionFilters
  assetOptions: string[]
  statusOptions: ReadonlyArray<TransactionFilters['status']>
  onFilterChange: (updates: Partial<TransactionFilters>) => void
  onReset: () => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  total: number
}

export function TransactionsToolbar({
  filters,
  assetOptions,
  statusOptions,
  onFilterChange,
  onReset,
  pageSize,
  onPageSizeChange,
  total,
}: TransactionsToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__filters">
        <label className="toolbar__field">
          <span>Status</span>
          <select
            value={filters.status}
            onChange={(event) => onFilterChange({ status: event.target.value as TransactionFilters['status'] })}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="toolbar__field">
          <span>Asset</span>
          <select value={filters.asset} onChange={(event) => onFilterChange({ asset: event.target.value })}>
            {assetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="toolbar__field toolbar__search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search ID, counterparty, asset"
            value={filters.search}
            onChange={(event) => onFilterChange({ search: event.target.value })}
          />
        </label>

        <button type="button" className="toolbar__reset" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="toolbar__meta">
        <label className="toolbar__field">
          <span>Rows per page</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <span className="toolbar__total" aria-live="polite">
          {total.toLocaleString()} transactions
        </span>
      </div>
    </div>
  )
}
