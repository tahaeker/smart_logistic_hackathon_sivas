"""Smart Logistics API — FastAPI Application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Smart Logistics API",
    description="Real-time delivery route optimization with ML-powered delay prediction",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import routes, predictions, optimize, simulate

app.include_router(routes.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(optimize.router, prefix="/api")
app.include_router(simulate.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "Smart Logistics API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "GET  /api/routes",
            "GET  /api/routes/{route_id}",
            "POST /api/predict",
            "POST /api/optimize",
            "GET  /api/stats/overview",
            "GET  /api/weather/current",
            "GET  /api/traffic/segments",
            "POST /api/simulate",
        ]
    }


@app.get("/health")
def health():
    return {"status": "ok"}
