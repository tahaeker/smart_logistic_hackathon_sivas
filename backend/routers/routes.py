"""Routes API endpoints."""

from fastapi import APIRouter, HTTPException
from services.data_service import load_routes, get_route_by_id, get_stops_for_route
from services.routing_service import get_route_geometry

router = APIRouter(tags=["routes"])


@router.get("/routes")
def list_routes():
    """List all routes."""
    routes = load_routes()
    return routes.to_dict('records')


@router.get("/routes/{route_id}")
def get_route(route_id: str):
    """Get route details with stops and real road geometry between consecutive stops."""
    route = get_route_by_id(route_id)
    if route is None:
        raise HTTPException(status_code=404, detail=f"Route {route_id} not found")

    stops = get_stops_for_route(route_id)
    # Fetch real road geometry from OSRM (cached to disk on first call)
    segments = get_route_geometry(route_id, stops)

    return {
        "route": route,
        "stops": stops,
        "segments": segments,
    }
