import type { Transaction } from '@/types/transaction'

const DEFAULT_API_URL = '/transactions.json'

export interface FetchTransactionsParams {
  signal?: AbortSignal
  url?: string
}

function resolveBaseUrl(): string {
  const globalUrl = (globalThis as unknown as { __VITE_TRANSACTIONS_API__?: string }).__VITE_TRANSACTIONS_API__
  return globalUrl ?? DEFAULT_API_URL
}

export async function fetchTransactions({
  signal,
  url = resolveBaseUrl(),
}: FetchTransactionsParams = {}): Promise<Transaction[]> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status}`)
  }

  const payload = await response.json()

  if (Array.isArray(payload)) {
    return payload as Transaction[]
  }

  if (Array.isArray(payload.transactions)) {
    return payload.transactions as Transaction[]
  }

  throw new Error('Unexpected response shape when fetching transactions')
}
