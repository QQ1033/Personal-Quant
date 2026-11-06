// Plain-English definitions for the terms the backend attaches to briefing items.
// See _CATEGORY_TERMS in backend/app/services/classify.py. Terms without an entry
// here (everyday words like "headline" or "source") don't get a pop-up.

export type Term = {
  label: string
  definition: string
  example: string
}

const TERMS: Record<string, Term> = {
  earnings: {
    label: 'Earnings',
    definition:
      "A company's profit over a period, usually three months (a quarter). Each quarter, public companies publish an earnings report showing their sales, costs and profit.",
    example:
      'If a coffee shop sells $10,000 of coffee in a quarter and spends $8,000 running the shop, its earnings are $2,000.',
  },
  revenue: {
    label: 'Revenue',
    definition:
      "The total money a company brings in from sales, before any costs are taken out. It's different from earnings, which is what's left after costs.",
    example: 'A coffee shop that sells $10,000 of coffee in a quarter has $10,000 of revenue, whatever it spent.',
  },
  guidance: {
    label: 'Guidance',
    definition:
      "A company's own forecast of how it expects the next quarter or year to go. It's an estimate, not a promise, and companies can change it.",
    example: "A company might say it expects next quarter's sales to be about the same as this quarter's.",
  },
  partnership: {
    label: 'Partnership',
    definition:
      'An agreement between two companies to work together on something, while each stays independent. The terms and the size of the deal vary a lot.',
    example: 'A carmaker might partner with a battery maker to supply its electric cars.',
  },
  acquisition: {
    label: 'Acquisition',
    definition:
      'When one company buys another company, or most of it. Big deals can take a long time to finish and may need approval from regulators.',
    example: 'A large software company might buy a smaller startup to get its product and its team.',
  },
  merger: {
    label: 'Merger',
    definition:
      'When two companies combine into one. It works a lot like an acquisition, but is usually described as a joining of companies rather than one buying the other.',
    example: 'Two regional banks might merge to become one larger bank.',
  },
  'product launch': {
    label: 'Product launch',
    definition:
      'When a company releases a new product or a major new version of one. An announcement can come well before people can actually buy it.',
    example: 'A phone maker revealing its new model at an event, then selling it a few weeks later.',
  },
  'market share': {
    label: 'Market share',
    definition: "The portion of all sales in an industry that goes to one company, usually shown as a percentage.",
    example: 'If people spend $100 million on sneakers and one brand gets $25 million of that, its market share is 25%.',
  },
  regulation: {
    label: 'Regulation',
    definition:
      'Rules set by governments that companies have to follow. New rules can change what a company is allowed to do or how much it costs to operate.',
    example: 'Rules about how apps collect personal data are a kind of regulation.',
  },
  inflation: {
    label: 'Inflation',
    definition:
      'The general rise in prices over time, which means the same amount of money buys less. It affects both what people can afford and what companies pay for supplies.',
    example: 'If prices rise 3% in a year, something that cost $100 last year costs about $103 now.',
  },
  cpi: {
    label: 'CPI',
    definition:
      'Short for Consumer Price Index: a monthly US government measure of how prices change for everyday things like food, rent and gas. It is one of the main ways inflation is tracked.',
    example: 'A headline saying "CPI rose 3% from last year" means those everyday prices went up about 3% on average.',
  },
  'interest rates': {
    label: 'Interest rates',
    definition:
      'The cost of borrowing money, shown as a percentage per year. When rates go up, loans get more expensive for people and companies.',
    example: 'A 5% rate on a $1,000 loan costs about $50 in interest per year.',
  },
  'federal reserve': {
    label: 'Federal Reserve',
    definition:
      'The central bank of the US, often called "the Fed." It sets a benchmark interest rate that affects borrowing costs across the economy.',
    example: 'When the Fed raises its rate, credit card and car loan rates usually go up too.',
  },
  ticker: {
    label: 'Ticker',
    definition: 'A short code used to identify a company\'s stock on an exchange.',
    example: 'AAPL is the ticker for Apple.',
  },
}

export function getTerm(name: string): Term | undefined {
  return TERMS[name.trim().toLowerCase()]
}
