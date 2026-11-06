"""
FastAPI entrypoint.

Keep this file thin: create the app, mount routers, expose / and /health.
Domain endpoints belong in app/api/*.py
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.articles import router as articles_router
from app.api.auth import router as auth_router
from app.api.briefings import router as briefings_router
from app.api.classifications import router as classifications_router
from app.api.companies import router as companies_router
from app.api.internal_jobs import router as internal_jobs_router
from app.api.macro import router as macro_router
from app.api.watchlist import router as watchlist_router
from app.core.config import APP_SCHEMA, ai_explanations_enabled, auth_env_ready
from app.database import engine
from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(_app: FastAPI):
    start_scheduler()
    try:
        yield
    finally:
        stop_scheduler()


app = FastAPI(title="Investory API", version="0.1.0", lifespan=lifespan)

# Allow the Vite dev server (and later production origins) to call this API
# from the browser with Authorization headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(companies_router)
app.include_router(watchlist_router)
app.include_router(briefings_router)
app.include_router(articles_router)
app.include_router(classifications_router)
app.include_router(macro_router)
app.include_router(internal_jobs_router)

CORE_TABLES = ("users", "companies", "watchlist_items")


@app.get("/")
def home():
    return {
        "message": "Investory API is running",
        "product": "Investory",
        "auth_configured": auth_env_ready(),
    }


@app.get("/health")
def health():
    """
    Ops check: can we reach Postgres, and do core investory.* tables exist?
    Useful after migrations and for deploy health checks later.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            rows = connection.execute(
                text(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = :schema
                      AND table_name IN (
                        'users', 'companies', 'watchlist_items',
                        'articles', 'briefings', 'briefing_items',
                        'classifications'
                      )
                    ORDER BY table_name
                    """
                ),
                {"schema": APP_SCHEMA},
            ).fetchall()
            found = {row[0] for row in rows}
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={"status": "error", "database": "unreachable", "error": str(exc)},
        ) from exc

    missing_core = sorted(set(CORE_TABLES) - found)
    if missing_core:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "degraded",
                "database": "connected",
                "schema": APP_SCHEMA,
                "missing_tables": missing_core,
                "hint": "Apply backend/db/migrations/001_core_tables.sql",
            },
        )

    return {
        "status": "ok",
        "database": "connected",
        "schema": APP_SCHEMA,
        "tables": sorted(found),
        "auth_configured": auth_env_ready(),
        "ai_explanations": ai_explanations_enabled(),
    }
