import { useEffect, useRef } from 'react'
import type { Term } from '../lib/terms'

type TermDialogProps = {
  term: Term
  onClose: () => void
}

function TermDialog({ term, onClose }: TermDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="term-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <span className="eyebrow">Term explainer</span>
          <button ref={closeRef} type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <h2 id="term-title" className="dialog-title">
          {term.label}
        </h2>
        <p className="body">{term.definition}</p>
        <div className="uncertain stack-xs">
          <span className="eyebrow">Example</span>
          <p>{term.example}</p>
        </div>
      </div>
    </div>
  )
}

export default TermDialog
