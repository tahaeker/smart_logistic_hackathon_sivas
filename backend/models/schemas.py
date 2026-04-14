"""Pydantic models for Smart Logistics API."""

from pydantic import BaseModel
from typing import List, Optional


class RouteRequest(BaseModel):
    route_id: str


class TopFactor(BaseModel):
    feature: str
    impact: float


class StopPrediction(BaseModel):
    stop_id: str
    stop_sequence: int
    predicted_delay_min: float
    miss_probability: float
    risk_level: str
    top_factors: List[TopFactor]


class PredictionResponse(BaseModel):
    route_id: str
    predictions: List[StopPrediction]


class OptimizationChange(BaseModel):
    action: str
    stop: int
    stop_id: str
    from_position: int
    to_position: int
    reason: str


class OptimizationResponse(BaseModel):
    original_order: List[int]
    optimized_order: List[int]
    estimated_time_saved_min: float
    windows_saved: int
    original_missed: int
    optimized_missed: int
    changes: List[OptimizationChange]


class OverviewStats(BaseModel):
    total_routes: int
    total_stops: int
    avg_delay_min: float
    on_time_rate: float
    missed_window_rate: float
    worst_weather: str
    worst_traffic: str
