import { useMemo, type ReactNode } from 'react'

import { TransactionsToolbar } from '@/components/TransactionsToolbar'
import { useTransactions } from '@/hooks/useTransactions'
import type { SortKey, Transaction } from '@/types/transaction'

interface ColumnDefinition {
  key: SortKey
  label: string
  align?: 'left' | 'right'
  width?: string
  sortable?: boolean
  render?: (transaction: Transaction) => ReactNode
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
})

const columns: ColumnDefinition[] = [
  { key: 'id', label: 'Transaction ID', width: '180px', sortable: true },
  { key: 'asset', label: 'Asset', width: '100px', sortable: true },
  { key: 'type', label: 'Type', width: '140px', sortable: true },
  { key: 'status', label: 'Status', width: '140px', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    align: 'right',
    width: '140px',
    sortable: true,
    render: (transaction) => currencyFormatter.format(transaction.amount),
  },
  {
    key: 'counterparty',
    label: 'Counterparty',
    width: '180px',
    sortable: true,
  },
  {
    key: 'timestamp',
    label: 'Trade Time',
    width: '220px',
    sortable: true,
    render: (transaction) => dateTimeFormatter.format(new Date(transaction.timestamp)),
  },
  {
    key: 'settlementDate',
    label: 'Settlement Date',
    width: '180px',
    sortable: true,
    render: (transaction) => dateFormatter.format(new Date(transaction.settlementDate)),
  },
]

export function TransactionsTable() {
  const {
    status,
    error,
    sort,
    filters,
    page,
    pageSize,
    total,
    totalPages,
    paginatedTransactions,
    assetOptions,
    statusOptions,
    toggleSort,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
    refetch,
  } = useTransactions()

  const emptyMessage = useMemo(() => {
    if (status === 'loading') {
      return 'Loading transactions...'
    }
    if (status === 'error') {
      return 'Unable to load transactions'
    }
    return 'No transactions match your filters'
  }, [status])

  const { firstRow, lastRow } = useMemo(() => {
    if (total === 0) {
      return { firstRow: 0, lastRow: 0 }
    }
    return {
      firstRow: (page - 1) * pageSize + 1,
      lastRow: Math.min(page * pageSize, total),
    }
  }, [page, pageSize, total])

  if (status === 'error') {
    return (
      <section className="transactions-panel">
        <header className="transactions-panel__header">
          <h1>Digital Asset Transactions</h1>
        </header>
        <div className="transactions-panel__error" role="alert">
          <p>{error ?? 'An unexpected error occurred.'}</p>
          <button type="button" onClick={refetch}>
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="transactions-panel">
      <header className="transactions-panel__header">
        <div>
          <h1>Digital Asset Transactions</h1>
          <p className="transactions-panel__subtitle">Monitor trade lifecycle activity across digital assets.</p>
        </div>
      </header>

      <TransactionsToolbar
        filters={filters}
        assetOptions={assetOptions}
        statusOptions={statusOptions}
        onFilterChange={setFilters}
        onReset={resetFilters}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        total={total}
      />

      <div className="transactions-table__container">
        <table className="transactions-table">
          <thead>
            <tr>
              {columns.map((column) => {
                const isActive = sort.key === column.key
                const ariaSort = isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
                return (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className={column.align ? `is-${column.align}` : undefined}
                    aria-sort={ariaSort}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className={isActive ? 'sort sort--active' : 'sort'}
                        onClick={() => toggleSort(column.key)}
                        aria-label={`Sort by ${column.label}`}
                      >
                        <span>{column.label}</span>
                        <span aria-hidden="true" className="sort__indicator">
                          {isActive ? (sort.direction === 'asc' ? '▲' : '▼') : '▴▾'}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && (
              <tr>
                <td colSpan={columns.length} className="transactions-table__placeholder">
                  Loading transactions...
                </td>
              </tr>
            )}

            {status !== 'loading' && paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="transactions-table__placeholder">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id}>
                {columns.map((column) => {
                  const value = column.render ? column.render(transaction) : (transaction[column.key] as React.ReactNode)
                  return (
                    <td key={column.key} className={column.align ? `is-${column.align}` : undefined}>
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="transactions-table__footer">
        <div className="pagination">
          <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
            Next
          </button>
        </div>

        <div className="pagination__details">
          <span>
            Showing {firstRow}-{lastRow} of {total.toLocaleString()} records
          </span>
        </div>
      </footer>
    </section>
  )
}
