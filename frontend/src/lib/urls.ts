// These URLs come from scraped news feeds, so only link to real web addresses.
export function isWebUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

// "https://www.reuters.com/some/story" -> "reuters.com"
export function siteName(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}
