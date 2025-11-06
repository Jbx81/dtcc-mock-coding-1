import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'

import { fetchTransactions } from '@/api/transactionsApi'
import type { SortKey, SortState, Transaction, TransactionFilters } from '@/types/transaction'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

interface TransactionsState {
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  status: RequestStatus
  error: string | null
  sort: SortState
  filters: TransactionFilters
  page: number
  pageSize: number
  lastFetchedAt: string | null
}

type TransactionsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Transaction[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'TOGGLE_SORT'; payload: SortKey }
  | { type: 'SET_FILTERS'; payload: Partial<TransactionFilters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }

interface TransactionsContextValue {
  status: RequestStatus
  error: string | null
  sort: SortState
  filters: TransactionFilters
  page: number
  pageSize: number
  total: number
  totalPages: number
  paginatedTransactions: Transaction[]
  assetOptions: string[]
  statusOptions: ReadonlyArray<TransactionFilters['status']>
  toggleSort: (key: SortKey) => void
  setFilters: (updates: Partial<TransactionFilters>) => void
  resetFilters: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  refetch: () => void
}

const DEFAULT_FILTERS: TransactionFilters = {
  status: 'All',
  asset: 'All',
  search: '',
}

const DEFAULT_SORT: SortState = {
  key: 'timestamp',
  direction: 'desc',
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const
const STATUS_OPTIONS: ReadonlyArray<TransactionFilters['status']> = ['All', 'Completed', 'Pending', 'Failed']

const initialState: TransactionsState = {
  transactions: [],
  filteredTransactions: [],
  status: 'idle',
  error: null,
  sort: DEFAULT_SORT,
  filters: { ...DEFAULT_FILTERS },
  page: 1,
  pageSize: PAGE_SIZE_OPTIONS[0],
  lastFetchedAt: null,
}

function expandTransactionsForDemo(data: Transaction[]): Transaction[] {
  if (data.length >= 120) {
    return data
  }

  const target = Math.min(200, Math.max(120, data.length * 5))
  const expanded: Transaction[] = [...data]

  for (let i = 0; expanded.length < target; i += 1) {
    data.forEach((transaction, index) => {
      if (expanded.length >= target) return
      const offsetMinutes = i * 7 + index + 1
      const timestamp = new Date(new Date(transaction.timestamp).getTime() + offsetMinutes * 60 * 1000)
      expanded.push({
        ...transaction,
        id: `${transaction.id}-R${i + 1}-${index + 1}`,
        timestamp: timestamp.toISOString(),
      })
    })
  }

  return expanded
}

function compareValues(a: unknown, b: unknown, key: SortKey, direction: SortState['direction']): number {
  const modifier = direction === 'asc' ? 1 : -1

  if (key === 'amount') {
    const aNumber = typeof a === 'number' ? a : Number(a)
    const bNumber = typeof b === 'number' ? b : Number(b)
    return (aNumber - bNumber) * modifier
  }

  if (key === 'timestamp' || key === 'settlementDate') {
    const aTime = new Date(a as string).getTime()
    const bTime = new Date(b as string).getTime()
    return (aTime - bTime) * modifier
  }

  const aString = String(a).toLowerCase()
  const bString = String(b).toLowerCase()

  if (aString === bString) return 0

  return aString > bString ? modifier : -modifier
}

function applyFiltersAndSorting(
  transactions: Transaction[],
  filters: TransactionFilters,
  sort: SortState,
): Transaction[] {
  const normalizedSearch = filters.search.trim().toLowerCase()

  const filtered = transactions.filter((transaction) => {
    const matchesStatus = filters.status === 'All' || transaction.status === filters.status
    const matchesAsset = filters.asset === 'All' || transaction.asset === filters.asset

    if (!matchesStatus || !matchesAsset) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    const haystack = [
      transaction.id,
      transaction.asset,
      transaction.type,
      transaction.counterparty,
      transaction.status,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })

  return filtered.sort((a, b) => {
    const aValue = a[sort.key]
    const bValue = b[sort.key]
    return compareValues(aValue, bValue, sort.key, sort.direction)
  })
}

function clampPage(page: number, totalPages: number): number {
  if (totalPages === 0) return 1
  return Math.min(Math.max(1, page), totalPages)
}

function recomputeState(
  state: TransactionsState,
  overrides: Partial<Omit<TransactionsState, 'filteredTransactions'>> = {},
): TransactionsState {
  const next: TransactionsState = {
    ...state,
    ...overrides,
  }

  const filteredTransactions = applyFiltersAndSorting(next.transactions, next.filters, next.sort)
  const totalPages = Math.ceil(filteredTransactions.length / next.pageSize)

  return {
    ...next,
    filteredTransactions,
    page: clampPage(next.page, totalPages),
  }
}

function transactionsReducer(state: TransactionsState, action: TransactionsAction): TransactionsState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        status: 'loading',
        error: null,
      }
    case 'FETCH_SUCCESS': {
      const enhanced = expandTransactionsForDemo(action.payload)
      const nextState = recomputeState(state, {
        transactions: enhanced,
        status: 'success',
        error: null,
        page: 1,
        lastFetchedAt: new Date().toISOString(),
      })
      return nextState
    }
    case 'FETCH_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
      }
    case 'TOGGLE_SORT': {
      const isSameKey = state.sort.key === action.payload
      const nextSort: SortState = isSameKey
        ? { key: action.payload, direction: state.sort.direction === 'asc' ? 'desc' : 'asc' }
        : {
            key: action.payload,
            direction:
              action.payload === 'timestamp' || action.payload === 'settlementDate' || action.payload === 'amount'
                ? 'desc'
                : 'asc',
          }

      return recomputeState(state, {
        sort: nextSort,
        page: 1,
      })
    }
    case 'SET_FILTERS': {
      return recomputeState(state, {
        filters: {
          ...state.filters,
          ...action.payload,
        },
        page: 1,
      })
    }
    case 'RESET_FILTERS':
      return recomputeState(state, {
        filters: { ...DEFAULT_FILTERS },
        page: 1,
      })
    case 'SET_PAGE':
      return recomputeState(state, {
        page: action.payload,
      })
    case 'SET_PAGE_SIZE':
      return recomputeState(state, {
        pageSize: action.payload,
        page: 1,
      })
    default:
      return state
  }
}

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined)

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transactionsReducer, initialState)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    dispatch({ type: 'FETCH_START' })

    fetchTransactions({ signal: controller.signal })
      .then((transactions) => {
        dispatch({ type: 'FETCH_SUCCESS', payload: transactions })
      })
      .catch((error: unknown) => {
        if ((error as Error).name === 'AbortError') {
          return
        }
        const message = error instanceof Error ? error.message : 'Unknown error'
        dispatch({ type: 'FETCH_ERROR', payload: message })
      })

    return () => {
      controller.abort()
    }
  }, [refreshToken])

  const total = state.filteredTransactions.length
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize))
  const start = (state.page - 1) * state.pageSize
  const end = start + state.pageSize
  const paginatedTransactions = useMemo(
    () => state.filteredTransactions.slice(start, end),
    [state.filteredTransactions, start, end],
  )

  const assetOptions = useMemo(() => {
    const unique = new Set<string>()
    state.transactions.forEach((transaction) => unique.add(transaction.asset))
    return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
  }, [state.transactions])

  const statusOptions = useMemo(() => STATUS_OPTIONS, [])

  const toggleSort = useCallback((key: SortKey) => {
    dispatch({ type: 'TOGGLE_SORT', payload: key })
  }, [])

  const setFilters = useCallback((updates: Partial<TransactionFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: updates })
  }, [])

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' })
  }, [])

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page })
  }, [])

  const setPageSize = useCallback((size: number) => {
    dispatch({ type: 'SET_PAGE_SIZE', payload: size })
  }, [])

  const refetch = useCallback(() => {
    setRefreshToken((token) => token + 1)
  }, [])

  const value = useMemo<TransactionsContextValue>(
    () => ({
      status: state.status,
      error: state.error,
      sort: state.sort,
      filters: state.filters,
      page: state.page,
      pageSize: state.pageSize,
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
    }),
    [
      state.status,
      state.error,
      state.sort,
      state.filters,
      state.page,
      state.pageSize,
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
    ],
  )

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
}

export function useTransactionsContext(): TransactionsContextValue {
  const context = useContext(TransactionsContext)
  if (!context) {
    throw new Error('useTransactionsContext must be used within a TransactionsProvider')
  }
  return context
}

export const transactionsInternal = {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  expandTransactionsForDemo,
  applyFiltersAndSorting,
  compareValues,
  transactionsReducer,
}
