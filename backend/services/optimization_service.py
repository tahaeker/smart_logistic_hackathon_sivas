"""Optimization service — wraps ML optimizer for API use."""

import os
import sys

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
ML_DIR = os.path.join(_PROJECT_DIR, 'ml')
sys.path.insert(0, ML_DIR)

from optimizer import optimize_route
from services.data_service import get_stops_for_route
from services.prediction_service import predict_for_route
from services.routing_service import get_optimized_geometry


def optimize_for_route(route_id: str):
    """
    Run optimization for a given route.
    Returns optimization result dict, including real-road segments for the
    optimized visit order (OSRM geometry, cached per unique order).
    """
    stops = get_stops_for_route(route_id)
    if not stops:
        return {"error": f"No stops found for route {route_id}"}

    predictions = predict_for_route(route_id)
    if not predictions:
        return {"error": f"No predictions available for route {route_id}"}

    result = optimize_route(stops, predictions)
    result["route_id"] = route_id

    # Attach real road geometry for the optimized visit order
    optimized_order = result.get("optimized_order") or []
    if optimized_order:
        result["segments"] = get_optimized_geometry(route_id, stops, optimized_order)
    else:
        result["segments"] = []

    return result
