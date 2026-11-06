"""
Tests for AI explanations and the template fallback. No network or API key needed.

Run from backend/:  python -m unittest discover tests
"""
import os
import unittest
from unittest import mock

os.environ.setdefault("user", "test")
os.environ.setdefault("password", "test")
os.environ.setdefault("host", "localhost")
os.environ.setdefault("port", "5432")
os.environ.setdefault("dbname", "test")

import anthropic  # noqa: E402

from app.services import briefing_builder, explainer  # noqa: E402
from app.services.news import NewsHeadline  # noqa: E402

HEADLINE = NewsHeadline(
    title="Apple reports record earnings",
    url="https://example.com/story",
    summary="Apple said sales rose.",
    published_at=None,
    ticker="AAPL",
)


def fake_response(parsed, stop_reason="end_turn"):
    return mock.Mock(parsed_output=parsed, stop_reason=stop_reason)


class ExplainHeadlineTests(unittest.TestCase):
    def setUp(self):
        explainer._request_explanation.cache_clear()
        explainer._client.cache_clear()
        self.addCleanup(explainer._request_explanation.cache_clear)
        self.addCleanup(explainer._client.cache_clear)

    def explain_with(self, response):
        client = mock.Mock()
        client.beta.messages.parse.return_value = response
        with (
            mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}),
            mock.patch.object(explainer, "_client", return_value=client),
        ):
            return explainer.explain_headline("AAPL", "Title", "Summary"), client

    def test_no_key_returns_none_without_calling_api(self):
        with (
            mock.patch.dict(os.environ, clear=False),
            mock.patch.object(explainer, "_client") as client,
        ):
            os.environ.pop("ANTHROPIC_API_KEY", None)
            self.assertIsNone(explainer.explain_headline("AAPL", "Title", "Summary"))
            client.assert_not_called()

    def test_removes_advice_language_and_unknown_terms(self):
        parsed = explainer.Explanation(
            what_happened="Sales rose.",
            why_it_matters="You should buy now, because sales matter.",
            uncertainties="Unknown.",
            terms=["earnings", "made up term", "CPI"],
        )
        result, _ = self.explain_with(fake_response(parsed))
        self.assertNotIn("buy now", result.why_it_matters.lower())
        self.assertEqual(result.terms, ["earnings", "CPI"])

    def test_refusal_falls_back(self):
        result, _ = self.explain_with(fake_response(None, stop_reason="refusal"))
        self.assertIsNone(result)

    def test_api_error_falls_back(self):
        client = mock.Mock()
        client.beta.messages.parse.side_effect = anthropic.APIConnectionError(request=mock.Mock())
        with (
            mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}),
            mock.patch.object(explainer, "_client", return_value=client),
        ):
            self.assertIsNone(explainer.explain_headline("AAPL", "Title", "Summary"))

    def test_same_story_is_only_requested_once(self):
        parsed = explainer.Explanation(what_happened="a", why_it_matters="b", uncertainties="c")
        client = mock.Mock()
        client.beta.messages.parse.return_value = fake_response(parsed)
        with (
            mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test"}),
            mock.patch.object(explainer, "_client", return_value=client),
        ):
            explainer.explain_headline("AAPL", "Title", "Summary")
            explainer.explain_headline("AAPL", "Title", "Summary")
        self.assertEqual(client.beta.messages.parse.call_count, 1)


class BuilderTests(unittest.TestCase):
    def test_uses_ai_text_when_available(self):
        explanation = explainer.Explanation(
            what_happened="AI what", why_it_matters="AI why", uncertainties="AI unknown", terms=["revenue"]
        )
        with mock.patch.object(briefing_builder, "explain_headline", return_value=explanation):
            item = briefing_builder._item_from_headline(HEADLINE)
        self.assertEqual(item.why_it_matters, "AI why")
        self.assertEqual(item.terms, ["revenue"])

    def test_templates_differ_by_category_when_ai_is_off(self):
        with mock.patch.object(briefing_builder, "explain_headline", return_value=None):
            earnings = briefing_builder._item_from_headline(HEADLINE)
            other = briefing_builder._item_from_headline(
                NewsHeadline(title="A quiet day", url="https://example.com/2", summary=None, published_at=None, ticker="AAPL")
            )
        self.assertEqual(earnings.category, "earnings")
        self.assertIn("AAPL", earnings.why_it_matters)
        self.assertNotEqual(earnings.why_it_matters, other.why_it_matters)

    def test_build_keeps_ticker_order(self):
        def headlines(ticker, limit):
            return [
                NewsHeadline(title=f"{ticker} unique story {n}", url=f"https://example.com/{ticker}{n}", summary=None, published_at=None, ticker=ticker)
                for n in range(limit)
            ]

        with (
            mock.patch.object(briefing_builder, "explain_headline", return_value=None),
            mock.patch.object(briefing_builder, "fetch_latest_headlines", side_effect=headlines),
        ):
            items = briefing_builder.build_items_for_tickers(["AAPL", "MSFT"], per_ticker=1)
        self.assertEqual([item.ticker for item in items], ["AAPL", "MSFT"])


if __name__ == "__main__":
    unittest.main()
