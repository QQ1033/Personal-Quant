"""
Heuristic article classification (MVP).

PRD categories: earnings, partnerships, acquisitions, product_innovation,
competition, government_policy, inflation, interest_rates, other.
"""
from __future__ import annotations

import re

CATEGORIES: tuple[str, ...] = (
    "earnings",
    "partnerships",
    "acquisitions",
    "product_innovation",
    "competition",
    "government_policy",
    "inflation",
    "interest_rates",
    "other",
)

# Ordered: first match wins (more specific before generic "other")
_RULES: list[tuple[str, tuple[str, ...]]] = [
    (
        "earnings",
        (
            "earnings",
            "eps",
            "revenue",
            "quarterly results",
            "q1",
            "q2",
            "q3",
            "q4",
            "profit",
            "guidance",
            "beat estimates",
            "missed estimates",
        ),
    ),
    (
        "acquisitions",
        (
            "acqui",
            "merger",
            "takeover",
            "buyout",
            "to buy",
            "to acquire",
            "deal to purchase",
        ),
    ),
    (
        "partnerships",
        (
            "partner",
            "collaboration",
            "joint venture",
            "alliance",
            "signs deal with",
            "agreement with",
        ),
    ),
    (
        "product_innovation",
        (
            "launch",
            "unveils",
            "new product",
            "ai model",
            "chip",
            "software update",
            "feature",
            "patent",
            "innovation",
        ),
    ),
    (
        "competition",
        (
            "rival",
            "competitor",
            "market share",
            "versus",
            "vs.",
            "undercut",
            " competes ",
        ),
    ),
    (
        "government_policy",
        (
            "regulation",
            "regulator",
            "antitrust",
            "ftc",
            "sec probe",
            "congress",
            "tariff",
            "sanction",
            "lawsuit",
            "policy",
            "white house",
            "bill passes",
        ),
    ),
    (
        "inflation",
        (
            "inflation",
            "cpi",
            "ppi",
            "consumer prices",
            "cost of living",
        ),
    ),
    (
        "interest_rates",
        (
            "interest rate",
            "federal reserve",
            "fed ",
            "fomc",
            "rate cut",
            "rate hike",
            "yields",
            "treasury yield",
        ),
    ),
]

# Terms the frontend has pop-up definitions for (frontend/src/lib/terms.ts).
GLOSSARY_TERMS: tuple[str, ...] = (
    "earnings",
    "revenue",
    "guidance",
    "partnership",
    "acquisition",
    "merger",
    "product launch",
    "market share",
    "regulation",
    "inflation",
    "CPI",
    "interest rates",
    "Federal Reserve",
    "ticker",
)

# Fallback explanations when AI explanations are off or a call fails.
_CATEGORY_WHY: dict[str, str] = {
    "earnings": (
        "Earnings reports are one of the main ways the public learns how {ticker} is really doing: "
        "how much it sold, what it spent and what it kept. People also listen for what the company "
        "expects next."
    ),
    "partnerships": (
        "A partnership can give {ticker} access to new customers, technology or supplies without "
        "buying another company. What it's worth usually depends on the details and how long it takes "
        "to show up in results."
    ),
    "acquisitions": (
        "Buying or merging with another company can quickly change what {ticker} does and how it makes "
        "money. Big deals can also take a long time to finish and may need approval from regulators."
    ),
    "product_innovation": (
        "New products are how a company like {ticker} tries to keep customers and find new ones. "
        "An announcement shows the plan, but sales over time show whether people actually want it."
    ),
    "competition": (
        "Stories about rivals can show where {ticker} is ahead or behind. Competition affects how much "
        "a company can charge and how much it has to spend to keep its customers."
    ),
    "government_policy": (
        "New rules and government decisions can change what {ticker} is allowed to do or what it costs "
        "to operate, sometimes for its whole industry at once."
    ),
    "inflation": (
        "Inflation affects both what {ticker} pays for supplies and how much its customers can afford "
        "to spend, which is why companies and investors watch it closely."
    ),
    "interest_rates": (
        "Interest rates change how much it costs {ticker} and its customers to borrow money. They also "
        "affect how investors value profits expected years from now."
    ),
    "other": (
        "This story mentions {ticker}, but it may be about the wider market rather than the company "
        "itself. Reading the source is the best way to see how closely it connects."
    ),
}

_CATEGORY_TERMS: dict[str, list[str]] = {
    "earnings": ["earnings", "revenue", "guidance"],
    "partnerships": ["partnership", "collaboration"],
    "acquisitions": ["acquisition", "merger"],
    "product_innovation": ["product launch", "innovation"],
    "competition": ["competition", "market share"],
    "government_policy": ["regulation", "policy"],
    "inflation": ["inflation", "CPI"],
    "interest_rates": ["interest rates", "Federal Reserve"],
    "other": ["headline", "source", "ticker"],
}

_MACRO_FOR_CATEGORY: dict[str, str] = {
    "earnings": (
        "Company results can move how people think about a business, but the "
        "broader economy (jobs, rates, inflation) still shapes demand and costs."
    ),
    "partnerships": (
        "Partnerships can change a company's reach; industry and policy trends "
        "often decide how valuable the collaboration becomes."
    ),
    "acquisitions": (
        "Deals can reshape a company quickly. Antitrust policy and financing "
        "conditions (including interest rates) often affect whether deals close."
    ),
    "product_innovation": (
        "New products compete in markets shaped by consumer demand, regulation, "
        "and macro cycles — not just engineering alone."
    ),
    "competition": (
        "Competitive news is local to an industry, but input costs and rates can "
        "change who can invest aggressively."
    ),
    "government_policy": (
        "Policy and political decisions can change rules of the game for whole "
        "sectors (trade, energy, tech, healthcare)."
    ),
    "inflation": (
        "Inflation affects what households and businesses can spend, and what "
        "companies pay for inputs — relevant when reading company news."
    ),
    "interest_rates": (
        "Interest rates influence borrowing costs and how investors value "
        "future cash flows — a common macro link for many stocks."
    ),
    "other": (
        "Broader forces like interest rates, inflation, and regulation can "
        "amplify or dampen how news like this affects a company over time."
    ),
}


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def classify_headline(title: str, summary: str | None = None) -> tuple[str, float]:
    """
    Return (category, confidence 0-1).
    Keyword heuristics only — replace with LLM later.
    """
    blob = normalize_text(f"{title} {summary or ''}")
    for category, keywords in _RULES:
        for kw in keywords:
            if normalize_text(kw) in blob:
                # Longer keyword matches feel slightly more confident
                confidence = min(0.9, 0.55 + 0.05 * len(kw.split()))
                return category, confidence
    return "other", 0.35


def why_it_matters_for(category: str, ticker: str) -> str:
    return _CATEGORY_WHY.get(category, _CATEGORY_WHY["other"]).format(ticker=ticker)


def beginner_terms_for(category: str) -> list[str]:
    return list(_CATEGORY_TERMS.get(category, _CATEGORY_TERMS["other"]))


def macro_blurb_for(category: str) -> str:
    return _MACRO_FOR_CATEGORY.get(category, _MACRO_FOR_CATEGORY["other"])
