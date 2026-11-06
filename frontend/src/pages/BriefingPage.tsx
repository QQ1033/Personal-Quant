import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import StoryCard from '../components/StoryCard'
import {
  generateBriefing,
  getTodayBriefing,
  listWatchlist,
  type Briefing,
  type WatchlistItem,
} from '../lib/api'

export function BriefingPage() {
  const { accessToken } = useAuth()
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    void Promise.all([getTodayBriefing(accessToken), listWatchlist(accessToken)])
      .then(([todayBriefing, items]) => {
        setBriefing(todayBriefing)
        setWatchlist(items)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load briefing'))
  }, [accessToken])

  async function onBuild() {
    if (!accessToken) return
    setBuilding(true)
    setError(null)
    try {
      setBriefing(await generateBriefing(accessToken))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build your briefing')
    } finally {
      setBuilding(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const items = briefing?.items ?? []
  const companyStoryCount = items.filter((item) => item.ticker).length
  const nameFor = (ticker: string | null) =>
    watchlist.find((entry) => entry.company.ticker === ticker)?.company.name
  const quietCompanies = watchlist
    .filter((entry) => !items.some((item) => item.ticker === entry.company.ticker))
    .map((entry) => entry.company.name)

  return (
    <main className="page">
      <div className="stack-sm">
        <p className="eyebrow">{today}</p>
        <h1 className="page-title">Your daily briefing</h1>
        {items.length > 0 && (
          <p className="muted lead">
            {companyStoryCount === 1 ? '1 update' : `${companyStoryCount} updates`} for your watchlist.
          </p>
        )}
      </div>

      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      {!briefing && !error && (
        <div className="stack-sm" role="status" aria-label="Loading your briefing">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}

      {items.map((item, index) => (
        <StoryCard key={item.id} item={item} companyName={nameFor(item.ticker)} defaultExpanded={index === 0} />
      ))}

      {briefing && items.length > 0 && quietCompanies.length > 0 && (
        <div className="quiet stack-sm">
          <p>No stories in today's briefing yet for {quietCompanies.join(', ')}.</p>
          <button type="button" className="btn btn--outline quiet-action" disabled={building} onClick={() => void onBuild()}>
            {building ? 'Updating…' : 'Update my briefing'}
          </button>
        </div>
      )}

      {briefing && items.length === 0 && watchlist.length > 0 && (
        <div className="card empty">
          <h2 className="card-title">Today's briefing isn't ready yet</h2>
          <p className="muted">Briefings refresh every day. You can also build today's now, which can take up to a minute.</p>
          <button type="button" className="btn btn--primary" disabled={building} onClick={() => void onBuild()}>
            {building ? 'Building…' : "Build today's briefing"}
          </button>
        </div>
      )}

      {briefing && watchlist.length === 0 && (
        <div className="card empty">
          <h2 className="card-title">Your watchlist is empty</h2>
          <p className="muted">Follow a few companies and their news shows up here each morning.</p>
          <Link className="btn btn--primary" to="/watchlist">
            Find companies
          </Link>
        </div>
      )}

      <p className="small muted">
        Investory explains news for learning. It doesn't predict prices or give buy, sell or hold advice.
      </p>
    </main>
  )
}
