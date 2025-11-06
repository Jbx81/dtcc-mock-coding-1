import { TransactionsTable } from '@/components/TransactionsTable'
import { TransactionsProvider } from '@/context/TransactionsContext'

import './App.css'

export default function App() {
  return (
    <TransactionsProvider>
      <main className="app-shell">
        <TransactionsTable />
      </main>
    </TransactionsProvider>
  )
}
