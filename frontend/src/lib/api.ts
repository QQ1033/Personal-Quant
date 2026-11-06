const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error('Missing VITE_API_URL in frontend/.env')
}

async function apiFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`${path} failed (${response.status}): ${detail}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export type InvestoryProfile = {
  id: string
  email: string | null
  display_name: string | null
  created_at: string | null
  updated_at: string | null
}

export type Company = {
  id: string
  ticker: string
  name: string
  exchange: string | null
}

export type WatchlistItem = {
  id: string
  created_at: string | null
  company: Company
  today_item_count: number
  last_briefing_at: string | null
}

export type BriefingItem = {
  id: string
  ticker: string | null
  category: string
  headline: string
  what_happened: string
  why_it_matters: string
  macro_link: string | null
  terms: string[]
  uncertainties: string
  facts: string[]
  implications: string[]
  source_urls: string[]
}

export type Briefing = {
  date: string
  status: string
  items: BriefingItem[]
  note: string | null
}

export type HubArticle = {
  id: string
  title: string
  url: string
  summary: string | null
  provider: string
  category: string
  published_at: string | null
}

export type HubFiling = {
  form: string
  title: string
  url: string
  filed_at: string | null
}

export type HubMacroSignal = {
  theme: string
  headline: string
  why_it_may_matter: string
  source_url: string | null
}

export type CompanyHub = {
  company: Company
  briefing_date: string | null
  status: string
  note: string | null
  items: BriefingItem[]
  articles: HubArticle[]
  filings: HubFiling[]
  macro_signals: HubMacroSignal[]
}

export const fetchMe = (token: string) =>
  apiFetch<InvestoryProfile>('/auth/me', token)

export const searchCompanies = (token: string, q: string) =>
  apiFetch<Company[]>(`/companies/search?q=${encodeURIComponent(q)}`, token)

export const getCompanyHub = (token: string, ticker: string) =>
  apiFetch<CompanyHub>(`/companies/${encodeURIComponent(ticker)}/hub`, token)

export const listWatchlist = (token: string) =>
  apiFetch<WatchlistItem[]>('/watchlist', token)

export const addToWatchlist = (
  token: string,
  body: { company_id?: string; ticker?: string; name?: string },
) =>
  apiFetch<WatchlistItem>('/watchlist', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const removeFromWatchlist = (token: string, itemId: string) =>
  apiFetch<void>(`/watchlist/${itemId}`, token, { method: 'DELETE' })

export const getTodayBriefing = (token: string) =>
  apiFetch<Briefing>('/briefings/today', token)

export const generateBriefing = (token: string) =>
  apiFetch<Briefing>('/briefings/generate', token, { method: 'POST' })
