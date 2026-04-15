"""Pydantic models for Smart Logistics API."""

from pydantic import BaseModel, Field
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


class StopConditionOverride(BaseModel):
    stop_sequence: int
    traffic_level: Optional[str] = None
    weather_condition: Optional[str] = None
    temperature_c: Optional[float] = None
    precipitation_mm: Optional[float] = Field(default=None, ge=0)
    wind_speed_kmh: Optional[float] = Field(default=None, ge=0)
    visibility_km: Optional[float] = Field(default=None, ge=0)
    humidity_pct: Optional[float] = Field(default=None, ge=0, le=100)
    road_incident: Optional[bool] = None
    incident_severity: Optional[float] = Field(default=None, ge=0)


class SimulationRequest(BaseModel):
    route_id: str
    overrides: List[StopConditionOverride]


class SimulationStopResult(BaseModel):
    stop_id: str
    stop_sequence: int
    original_delay_min: float
    original_miss_probability: float
    original_risk_level: str
    simulated_delay_min: float
    simulated_miss_probability: float
    simulated_risk_level: str
    delta_delay_min: float
    top_factors: List[TopFactor]


class SimulationResponse(BaseModel):
    route_id: str
    stops: List[SimulationStopResult]
    original_avg_delay_min: float
    simulated_avg_delay_min: float
    original_missed_windows: int
    simulated_missed_windows: int
    delta_avg_delay_min: float
