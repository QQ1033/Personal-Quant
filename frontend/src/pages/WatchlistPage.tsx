import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  addToWatchlist,
  listWatchlist,
  removeFromWatchlist,
  searchCompanies,
  type Company,
  type WatchlistItem,
} from '../lib/api'

type CompanyRowProps = {
  company: Company
  following: boolean
  detail: string
  action: ReactNode
}

function CompanyRow({ company, following, detail, action }: CompanyRowProps) {
  return (
    <div className="company-row">
      <span className={following ? 'ticker ticker--following' : 'ticker'}>{company.ticker}</span>
      <div className="company-info">
        {following ? (
          <Link className="company-name company-link" to={`/companies/${company.ticker}`}>
            {company.name}
          </Link>
        ) : (
          <span className="company-name">{company.name}</span>
        )}
        <span className="muted small">{detail}</span>
      </div>
      {action}
    </div>
  )
}

const POPULAR = ['Apple', 'Nvidia', 'Microsoft', 'Tesla', 'Amazon']

function updatesLabel(count: number) {
  if (count === 0) return 'No updates yet today'
  return count === 1 ? '1 update today' : `${count} updates today`
}

export function WatchlistPage() {
  const { accessToken } = useAuth()
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Company[]>([])
  const [searchedFor, setSearchedFor] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const q = query.trim()

  useEffect(() => {
    if (!accessToken) return
    void listWatchlist(accessToken)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load watchlist'))
      .finally(() => setLoaded(true))
  }, [accessToken])

  // Search as you type, waiting for a short pause so each keystroke isn't a request.
  useEffect(() => {
    if (!accessToken || !q) return
    let cancelled = false
    const timer = setTimeout(() => {
      void searchCompanies(accessToken, q)
        .then((found) => {
          if (cancelled) return
          setResults(found)
          setSearchedFor(q)
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed')
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [accessToken, q])

  async function onFollow(company: Company) {
    if (!accessToken) return
    setBusy(true)
    setError(null)
    try {
      await addToWatchlist(accessToken, { company_id: company.id })
      setItems(await listWatchlist(accessToken))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add company')
    } finally {
      setBusy(false)
    }
  }

  async function onRemove(itemId: string) {
    if (!accessToken) return
    setBusy(true)
    setError(null)
    try {
      await removeFromWatchlist(accessToken, itemId)
      setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove company')
    } finally {
      setBusy(false)
    }
  }

  const lower = q.toLowerCase()
  const following = items.filter(
    ({ company }) => !q || company.name.toLowerCase().includes(lower) || company.ticker.toLowerCase().includes(lower),
  )
  const suggestions = results.filter((company) => !items.some((item) => item.company.id === company.id))

  return (
    <main className="page">
      <div className="stack-sm">
        <h1 className="page-title">Watchlist</h1>
        <p className="muted lead">Follow companies to get them in your daily briefing.</p>
      </div>

      <div className="field">
        <label htmlFor="search">Search companies</label>
        <div className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or ticker, like Apple or AAPL"
          />
        </div>
      </div>

      {loaded && !q && items.length === 0 && (
        <div className="suggestions">
          <span className="muted small">Popular:</span>
          {POPULAR.map((name) => (
            <button key={name} type="button" className="term-chip" onClick={() => setQuery(name)}>
              {name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      {q && (
        <section className="stack-sm">
          <h2 className="eyebrow">Add companies</h2>
          {searchedFor === q &&
            suggestions.map((company) => (
              <CompanyRow
                key={company.id}
                company={company}
                following={false}
                detail={company.exchange ?? 'Stock'}
                action={
                  <button
                    type="button"
                    className="btn btn--primary"
                    aria-label={`Follow ${company.name}`}
                    disabled={busy}
                    onClick={() => void onFollow(company)}
                  >
                    Follow
                  </button>
                }
              />
            ))}
          {searchedFor !== q && <p className="muted">Searching…</p>}
          {searchedFor === q && suggestions.length === 0 && (
            <p className="muted">No other companies match that search.</p>
          )}
        </section>
      )}

      <section className="stack-sm">
        <h2 className="eyebrow">Following ({items.length})</h2>
        {following.map((item) => (
          <CompanyRow
            key={item.id}
            company={item.company}
            following
            detail={updatesLabel(item.today_item_count)}
            action={
              <div className="row-actions">
                <Link
                  className="btn btn--ghost"
                  to={`/companies/${item.company.ticker}`}
                  aria-label={`View ${item.company.name}`}
                >
                  View
                </Link>
                <button
                  type="button"
                  className="btn btn--outline"
                  aria-label={`Stop following ${item.company.name}`}
                  disabled={busy}
                  onClick={() => void onRemove(item.id)}
                >
                  Remove
                </button>
              </div>
            }
          />
        ))}
        {loaded && following.length === 0 && (
          <p className="muted">
            {items.length === 0
              ? "You're not following any companies yet. Search above to add your first one."
              : 'None of the companies you follow match that search.'}
          </p>
        )}
      </section>
    </main>
  )
}
