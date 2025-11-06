export type TransactionStatus = 'Completed' | 'Pending' | 'Failed'

export type TransactionType =
  | 'Trade'
  | 'Settlement'
  | 'Transfer'
  | 'Custody'

export interface Transaction {
  id: string
  asset: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  counterparty: string
  timestamp: string
  settlementDate: string
}

export interface TransactionFilters {
  status: TransactionStatus | 'All'
  asset: string
  search: string
}

export type SortKey = keyof Pick<
  Transaction,
  'id' | 'asset' | 'type' | 'status' | 'amount' | 'counterparty' | 'timestamp' | 'settlementDate'
>

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: SortKey
  direction: SortDirection
}
