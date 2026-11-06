import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { BriefingPage } from './pages/BriefingPage'
import { CompanyHubPage } from './pages/CompanyHubPage'
import { LoginPage } from './pages/LoginPage'
import { WatchlistPage } from './pages/WatchlistPage'
import './App.css'

function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <main className="page">
        <p className="muted">Loading…</p>
      </main>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/briefing" replace />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="briefing" element={<BriefingPage />} />
        <Route path="companies/:ticker" element={<CompanyHubPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
