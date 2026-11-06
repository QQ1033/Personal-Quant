import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import StoryCard from '../components/StoryCard'
import { getCompanyHub, type CompanyHub } from '../lib/api'
import { isWebUrl } from '../lib/urls'

export function CompanyHubPage() {
  const { ticker = '' } = useParams()
  const { accessToken } = useAuth()
  const [hub, setHub] = useState<CompanyHub | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken || !ticker) return
    void getCompanyHub(accessToken, ticker)
      .then(setHub)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load company page'))
  }, [accessToken, ticker])

  if (error) {
    return (
      <main className="page">
        <p className="notice notice--error" role="alert">
          {error}
        </p>
        <Link className="back-link" to="/watchlist">
          ← Watchlist
        </Link>
      </main>
    )
  }

  if (!hub) {
    return (
      <main className="page">
        <div className="stack-sm" role="status" aria-label="Loading company page">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </main>
    )
  }

  const articles = hub.articles.filter((article) => isWebUrl(article.url))
  const filings = hub.filings.filter((filing) => isWebUrl(filing.url))

  return (
    <main className="page">
      <Link className="back-link" to="/watchlist">
        ← Watchlist
      </Link>
      <div className="stack-sm">
        {hub.company.exchange && <p className="eyebrow">{hub.company.exchange}</p>}
        <h1 className="page-title">
          {hub.company.ticker} <span className="hub-name">{hub.company.name}</span>
        </h1>
        <p className="muted lead">News, filings and bigger-picture context, explained for learning.</p>
      </div>

      <section className="stack-sm">
        <h2 className="eyebrow">Today's stories</h2>
        {hub.items.length === 0 && (
          <p className="muted">No stories yet for this company. They appear after the daily refresh.</p>
        )}
        {hub.items.map((item, index) => (
          <StoryCard key={item.id} item={item} companyName={hub.company.name} defaultExpanded={index === 0} />
        ))}
      </section>

      <section className="stack-sm">
        <h2 className="eyebrow">News articles</h2>
        {articles.length === 0 && <p className="muted">No articles saved yet.</p>}
        {articles.length > 0 && (
          <div className="link-list">
            {articles.map((article) => (
              <div key={article.id} className="link-row">
                <span className="muted small">{article.provider}</span>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  {article.title}
                </a>
                {article.summary && <p className="muted small">{article.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stack-sm">
        <h2 className="eyebrow">SEC filings</h2>
        {filings.length === 0 && <p className="muted">No recent 8-K, 10-Q or 10-K filings found.</p>}
        {filings.length > 0 && (
          <div className="link-list">
            {filings.map((filing) => (
              <div key={`${filing.form}-${filing.url}-${filing.filed_at}`} className="link-row">
                <span className="muted small">
                  {filing.form}
                  {filing.filed_at ? ` · ${filing.filed_at}` : ''}
                </span>
                <a href={filing.url} target="_blank" rel="noopener noreferrer">
                  {filing.title}
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stack-sm">
        <h2 className="eyebrow eyebrow--macro">The big picture</h2>
        <p className="muted small">
          Broader themes that may relate to this company. Read the sources and decide what connects.
        </p>
        {hub.macro_signals.length > 0 && (
          <div className="link-list">
            {hub.macro_signals.map((signal) => (
              <div key={`${signal.theme}-${signal.headline}`} className="link-row">
                <span className="muted small">{signal.theme.replaceAll('_', ' ')}</span>
                <span className="company-name">{signal.headline}</span>
                <p className="small">{signal.why_it_may_matter}</p>
                {signal.source_url && isWebUrl(signal.source_url) && (
                  <a className="small" href={signal.source_url} target="_blank" rel="noopener noreferrer">
                    Source
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="small muted">
        Investory explains news for learning. It doesn't predict prices or give buy, sell or hold advice.
      </p>
    </main>
  )
}
