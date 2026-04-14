"""Optimization API endpoints."""

from fastapi import APIRouter, HTTPException
from models.schemas import RouteRequest
from services.optimization_service import optimize_for_route

router = APIRouter(tags=["optimization"])


@router.post("/optimize")
def optimize(request: RouteRequest):
    """Optimize stop order for a route."""
    result = optimize_for_route(request.route_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
