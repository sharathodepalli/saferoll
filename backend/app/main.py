"""FastAPI entrypoint for SafeRoll backend."""

import os
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import health as health_routes
from .routes import metrics as metrics_routes
from .routes import rollout as rollout_routes

app = FastAPI(title="SafeRoll", version="0.1.0")


def _allowed_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return ["http://localhost:5173"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_routes.router)
app.include_router(rollout_routes.router)
app.include_router(metrics_routes.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
