"""Data loading service — loads CSV files once and caches in memory."""

import os
import pandas as pd
from functools import lru_cache

# Resolve data directory relative to this file
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(_BACKEND_DIR), 'data')


@lru_cache(maxsize=1)
def load_routes():
    return pd.read_csv(os.path.join(DATA_DIR, 'routes.csv'))


@lru_cache(maxsize=1)
def load_stops():
    return pd.read_csv(os.path.join(DATA_DIR, 'route_stops.csv'))


@lru_cache(maxsize=1)
def load_traffic():
    return pd.read_csv(os.path.join(DATA_DIR, 'traffic_segments.csv'))


@lru_cache(maxsize=1)
def load_weather():
    return pd.read_csv(os.path.join(DATA_DIR, 'weather_observations.csv'))


@lru_cache(maxsize=1)
def load_historical():
    return pd.read_csv(os.path.join(DATA_DIR, 'historical_delay_stats.csv'))


def get_route_by_id(route_id: str):
    """Get a single route by ID."""
    routes = load_routes()
    match = routes[routes['route_id'] == route_id]
    if match.empty:
        return None
    return match.iloc[0].to_dict()


def get_stops_for_route(route_id: str):
    """Get all stops for a given route, ordered by stop_sequence."""
    stops = load_stops()
    route_stops = stops[stops['route_id'] == route_id].sort_values('stop_sequence')
    return route_stops.to_dict('records')
