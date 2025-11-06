import type { SortState, Transaction, TransactionFilters } from '@/types/transaction'

import { transactionsInternal } from './TransactionsContext'

const sampleTransactions: Transaction[] = [
  {
    id: 'TX-1',
    asset: 'BTC',
    type: 'Trade',
    status: 'Completed',
    amount: 2,
    counterparty: 'Alpha',
    timestamp: '2024-01-01T10:00:00Z',
    settlementDate: '2024-01-02',
  },
  {
    id: 'TX-2',
    asset: 'ETH',
    type: 'Settlement',
    status: 'Pending',
    amount: 5,
    counterparty: 'Beta',
    timestamp: '2024-01-02T10:00:00Z',
    settlementDate: '2024-01-05',
  },
  {
    id: 'TX-3',
    asset: 'BTC',
    type: 'Transfer',
    status: 'Completed',
    amount: 1,
    counterparty: 'Gamma',
    timestamp: '2024-01-03T10:00:00Z',
    settlementDate: '2024-01-04',
  },
]

const baseFilters: TransactionFilters = {
  status: 'All',
  asset: 'All',
  search: '',
}

describe('applyFiltersAndSorting', () => {
  it('sorts numerically when using amount column', () => {
    const sort: SortState = {
      key: 'amount',
      direction: 'asc',
    }

    const result = transactionsInternal.applyFiltersAndSorting(sampleTransactions, baseFilters, sort)

    expect(result.map((transaction) => transaction.id)).toEqual(['TX-3', 'TX-1', 'TX-2'])
  })

  it('sorts chronologically for timestamps', () => {
    const sort: SortState = {
      key: 'timestamp',
      direction: 'desc',
    }

    const result = transactionsInternal.applyFiltersAndSorting(sampleTransactions, baseFilters, sort)

    expect(result[0].id).toBe('TX-3')
  })

  it('filters by status, asset, and search term', () => {
    const filters: TransactionFilters = {
      status: 'Completed',
      asset: 'BTC',
      search: 'gamma',
    }

    const result = transactionsInternal.applyFiltersAndSorting(sampleTransactions, filters, {
      key: 'id',
      direction: 'asc',
    })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('TX-3')
  })
})
