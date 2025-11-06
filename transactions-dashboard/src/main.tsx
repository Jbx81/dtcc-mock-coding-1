import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (typeof globalThis !== 'undefined') {
  globalThis.__VITE_TRANSACTIONS_API__ = import.meta.env.VITE_TRANSACTIONS_API
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
