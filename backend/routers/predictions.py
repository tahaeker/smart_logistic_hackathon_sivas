"""Prediction API endpoints."""

from fastapi import APIRouter, HTTPException
from models.schemas import RouteRequest, PredictionResponse
from services.prediction_service import predict_for_route
from services.data_service import load_routes, load_stops, load_weather, load_traffic

router = APIRouter(tags=["predictions"])


@router.post("/predict")
def predict(request: RouteRequest):
    """Predict delay for all stops in a route."""
    predictions = predict_for_route(request.route_id)
    if not predictions:
        raise HTTPException(status_code=404, detail=f"Route {request.route_id} not found or no data")

    return {
        "route_id": request.route_id,
        "predictions": predictions
    }


@router.get("/stats/overview")
def stats_overview():
    """General statistics for the dashboard."""
    routes = load_routes()
    stops = load_stops()

    total_routes = len(routes)
    total_stops = len(stops)
    avg_delay = float(routes['total_delay_min'].mean())
    on_time_rate = float(routes['on_time_delivery_rate'].mean())
    missed_window_rate = float(stops['missed_time_window'].mean())

    # Worst conditions
    worst_weather = routes.groupby('weather_condition')['total_delay_min'].mean().idxmax()
    worst_traffic = routes.groupby('traffic_level')['total_delay_min'].mean().idxmax()

    return {
        "total_routes": total_routes,
        "total_stops": total_stops,
        "avg_delay_min": round(avg_delay, 1),
        "on_time_rate": round(on_time_rate, 3),
        "missed_window_rate": round(missed_window_rate, 3),
        "worst_weather": worst_weather,
        "worst_traffic": worst_traffic,
    }


@router.get("/weather/current")
def current_weather():
    """Current weather observations for map overlay."""
    weather = load_weather()
    return weather.to_dict('records')


@router.get("/traffic/segments")
def traffic_segments():
    """Traffic segments for map overlay."""
    traffic = load_traffic()
    return traffic.to_dict('records')
