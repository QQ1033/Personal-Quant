"""
Build beginner-friendly briefing items from headlines.

Claude writes the explanations when ANTHROPIC_API_KEY is set (see explainer.py).
Otherwise, or if a call fails, items use the category templates in classify.py.

No buy/sell language. Educational framing only.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

from app.schemas.briefings import BriefingItemOut
from app.services.classify import (
    beginner_terms_for,
    classify_headline,
    macro_blurb_for,
    why_it_matters_for,
)
from app.services.dedupe import is_near_duplicate
from app.services.explainer import explain_headline
from app.services.news import fetch_latest_headlines
from app.services.safety import strip_advice_language


def _item_from_headline(h) -> BriefingItemOut:
    category, _confidence = classify_headline(h.title, h.summary)
    summary = (h.summary or "").strip()

    explanation = explain_headline(h.ticker, h.title, summary or None)
    if explanation:
        return BriefingItemOut(
            id=str(uuid4()),
            ticker=h.ticker,
            category=category,
            headline=h.title,
            what_happened=explanation.what_happened,
            why_it_matters=explanation.why_it_matters,
            macro_link=explanation.macro_link,
            terms=explanation.terms,
            uncertainties=explanation.uncertainties,
            facts=[h.title],
            implications=[explanation.why_it_matters],
            source_urls=[h.url],
        )

    what = strip_advice_language(summary or h.title)
    return BriefingItemOut(
        id=str(uuid4()),
        ticker=h.ticker,
        category=category,
        headline=h.title,
        what_happened=what,
        why_it_matters=strip_advice_language(why_it_matters_for(category, h.ticker)),
        macro_link=macro_blurb_for(category),
        terms=beginner_terms_for(category),
        uncertainties=(
            "Headlines can be incomplete or outdated. This summary is educational, "
            "not verified financial analysis, and not investment advice."
        ),
        facts=[h.title],
        implications=[
            "Possible implication only: the market or the company's narrative may "
            "react — or it may not. Treat this as a learning prompt.",
        ],
        source_urls=[h.url],
    )


def _fallback_item(ticker: str) -> BriefingItemOut:
    return BriefingItemOut(
        id=str(uuid4()),
        ticker=ticker,
        category="other",
        headline=f"{ticker}: no live headline available right now",
        what_happened=(
            f"We could not pull a fresh public headline for {ticker}. "
            "Your watchlist still works — updates appear after the next daily refresh."
        ),
        why_it_matters=(
            "A working watchlist + briefing layout is still useful for learning "
            "how Investory will present real developments."
        ),
        macro_link=macro_blurb_for("other"),
        terms=beginner_terms_for("other"),
        uncertainties="No primary source was retrieved for this ticker in this run.",
        facts=[f"{ticker} is on your watchlist."],
        implications=["No investment advice — educational placeholder."],
        source_urls=[],
    )


def build_items_for_tickers(tickers: list[str], per_ticker: int = 2) -> list[BriefingItemOut]:
    # Explaining a story is a slow network call, so run them side by side.
    with ThreadPoolExecutor(max_workers=4) as pool:
        batches = []
        for ticker in tickers[:6]:
            headlines = fetch_latest_headlines(ticker, limit=per_ticker)
            if headlines:
                batches.append(pool.map(_item_from_headline, headlines))
            else:
                batches.append([_fallback_item(ticker)])
        items: list[BriefingItemOut] = [item for batch in batches for item in batch]

    final: list[BriefingItemOut] = []
    for item in items:
        if any(
            item.headline
            and existing.headline
            and is_near_duplicate(item.headline, existing.headline)
            for existing in final
        ):
            continue
        final.append(item)
    return final
