"""Simulation router — what-if predictions with per-stop condition overrides."""

from fastapi import APIRouter, HTTPException
from models.schemas import SimulationRequest, SimulationResponse
from services.simulation_service import simulate_for_route

router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulationResponse)
def simulate(request: SimulationRequest):
    """
    What-if simülasyonu: belirtilen durakların koşullarını değiştirerek
    ML tahminlerini yeniden çalıştırır. Orijinal ve simüle tahminleri
    yan yana döndürür.
    """
    try:
        result = simulate_for_route(request.route_id, request.overrides)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Rota '{request.route_id}' bulunamadı veya durak verisi yok."
        )

    return result
