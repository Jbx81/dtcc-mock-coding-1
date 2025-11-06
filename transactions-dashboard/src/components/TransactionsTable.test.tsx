import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { TransactionsTable } from '@/components/TransactionsTable'
import { TransactionsProvider } from '@/context/TransactionsContext'
import type { Transaction } from '@/types/transaction'

const baseTransactions: Transaction[] = [
  {
    id: 'TEST-1',
    asset: 'BTC',
    type: 'Trade',
    status: 'Completed',
    amount: 2500,
    counterparty: 'Alpha',
    timestamp: '2024-01-01T10:00:00Z',
    settlementDate: '2024-01-03',
  },
  {
    id: 'TEST-2',
    asset: 'ETH',
    type: 'Settlement',
    status: 'Failed',
    amount: 500,
    counterparty: 'Beta',
    timestamp: '2024-01-02T10:00:00Z',
    settlementDate: '2024-01-04',
  },
  {
    id: 'TEST-3',
    asset: 'USDC',
    type: 'Transfer',
    status: 'Pending',
    amount: 1500000,
    counterparty: 'Gamma',
    timestamp: '2024-01-03T10:00:00Z',
    settlementDate: '2024-01-05',
  },
]

function buildDataset(): Transaction[] {
  const filler: Transaction[] = Array.from({ length: 130 - baseTransactions.length }, (_, index) => ({
    id: `FILL-${index}`,
    asset: index % 2 === 0 ? 'BTC' : 'SOL',
    type: 'Trade',
    status: 'Completed',
    amount: 1000 + index,
    counterparty: `Desk ${index}`,
    timestamp: new Date(2024, 0, 10, 12, index).toISOString(),
    settlementDate: '2024-01-12',
  }))

  return [...baseTransactions, ...filler]
}

function createFetchResponse(transactions: Transaction[]): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ transactions }),
  } as unknown as Response
}

describe('TransactionsTable', () => {
  const originalFetch = globalThis.fetch
  let fetchSpy: jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    fetchSpy = jest.fn().mockResolvedValue(createFetchResponse(buildDataset())) as jest.MockedFunction<typeof fetch>
    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchSpy
  })

  afterEach(() => {
    if (originalFetch) {
      (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch
    } else {
      delete (globalThis as { fetch?: typeof fetch }).fetch
    }
    fetchSpy.mockReset()
  })

  it('renders transactions and supports filtering by status and search', async () => {
    render(
      <TransactionsProvider>
        <TransactionsTable />
      </TransactionsProvider>,
    )

    expect(screen.getByText(/Digital Asset Transactions/i)).toBeInTheDocument()

    await waitFor(() => expect(screen.getAllByText(/FILL-/i).length).toBeGreaterThan(0))

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'Failed' } })

    await waitFor(() => {
      expect(screen.getByText('TEST-2')).toBeInTheDocument()
      expect(screen.queryByText('TEST-1')).not.toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Search ID, counterparty, asset/i)
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'All' } })
    fireEvent.change(searchInput, { target: { value: 'TEST-3' } })

    await waitFor(() => {
      expect(screen.getByText('TEST-3')).toBeInTheDocument()
      expect(screen.queryByText('TEST-2')).not.toBeInTheDocument()
    })
  })

  it('renders an error panel when the API request fails', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(
      <TransactionsProvider>
        <TransactionsTable />
      </TransactionsProvider>,
    )

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())

    expect(screen.getByText(/failed to fetch transactions: 500/i)).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
  })
})
