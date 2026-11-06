import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BriefingItem } from '../lib/api'
import { getTerm, type Term } from '../lib/terms'
import { isWebUrl, siteName } from '../lib/urls'
import TermDialog from './TermDialog'

type StoryCardProps = {
  item: BriefingItem
  companyName?: string
  defaultExpanded?: boolean
}

function StoryCard({ item, companyName, defaultExpanded = false }: StoryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [openTerm, setOpenTerm] = useState<Term | null>(null)
  const closeTerm = useCallback(() => setOpenTerm(null), [])

  const terms = item.terms.flatMap((name) => getTerm(name) ?? [])
  const sources = item.source_urls.filter(isWebUrl)
  const source = item.ticker ? companyName : 'Market'
  const category = item.category === 'other' ? '' : item.category.replaceAll('_', ' ')
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <article className="card">
      <div className="card-meta">
        {item.ticker ? (
          <Link className="tag" to={`/companies/${item.ticker}`}>
            {item.ticker}
          </Link>
        ) : (
          <span className="tag tag--macro">Big picture</span>
        )}
        <span className="muted small">{[source, categoryLabel].filter(Boolean).join(' · ')}</span>
      </div>
      <h2 className="card-title">{item.headline}</h2>

      <section className="stack-xs">
        <h3 className="eyebrow">What happened</h3>
        <p className="body">{item.what_happened}</p>
      </section>

      {expanded && (
        <>
          <section className="stack-xs">
            <h3 className="eyebrow">Why it may matter</h3>
            <p className="body">{item.why_it_matters}</p>
          </section>
          {item.macro_link && (
            <section className="stack-xs">
              <h3 className="eyebrow eyebrow--macro">How the big picture connects</h3>
              <p className="body">{item.macro_link}</p>
            </section>
          )}
          <section className="uncertain stack-xs">
            <h3 className="eyebrow">What's uncertain</h3>
            <p>{item.uncertainties}</p>
          </section>
          {sources.length > 0 && (
            <div className="sources">
              <span className="muted">Sources:</span>
              {sources.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  {siteName(url)}
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <div className="card-footer">
        <div className="terms">
          {terms.length > 0 && <span className="muted small">Terms:</span>}
          {terms.map((term) => (
            <button key={term.label} type="button" className="term-chip" onClick={() => setOpenTerm(term)}>
              {term.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Why it may matter'}
        </button>
      </div>

      {openTerm && <TermDialog term={openTerm} onClose={closeTerm} />}
    </article>
  )
}

export default StoryCard
