"""
Fault Injection API Routes.
Controls interactive real-time simulation fault injection across weather station sensors.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from backend.data.fault_injector import fault_injector

router = APIRouter(prefix="/api/faults", tags=["Fault Injection Sandbox"])


class FaultInjectionRequest(BaseModel):
    station_id: str = Field(default="AWS-001", description="Target station identifier")
    fault_type: str = Field(description="SPIKE | FLATLINE | DRIFT | INCONSISTENCY | OUT_OF_BOUNDS | NOISE_BURST | PACKET_LOSS")
    target_sensor: str = Field(description="temperature | humidity | pressure | wind_speed | solar_radiation | dew_point | precipitation | battery_voltage")
    magnitude: float = Field(default=0.0, description="Perturbation offset, locked value, or step increment")
    duration_steps: int = Field(default=30, description="Duration in simulation cycles")
    description: Optional[str] = Field(default="", description="Human-readable rationale for test scenario")


class ClearFaultsRequest(BaseModel):
    station_id: Optional[str] = Field(default=None, description="Optional target station ID to clear, or null for all")


@router.post("/inject")
def inject_fault(req: FaultInjectionRequest):
    """Trigger an interactive fault on a specific sensor."""
    fault_id = fault_injector.inject_fault(
        station_id=req.station_id,
        fault_type=req.fault_type,
        target_sensor=req.target_sensor,
        magnitude=req.magnitude,
        duration_steps=req.duration_steps,
        description=req.description,
    )
    return {
        "status": "SUCCESS",
        "fault_id": fault_id,
        "message": f"Fault '{req.fault_type}' successfully injected into sensor '{req.target_sensor}' for {req.duration_steps} steps.",
    }


@router.delete("/{station_id}/{fault_id}")
def remove_fault(station_id: str, fault_id: str):
    """Cancel an active fault immediately."""
    success = fault_injector.remove_fault(station_id, fault_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Fault '{fault_id}' not found for station '{station_id}'.")
    return {"status": "SUCCESS", "message": f"Fault '{fault_id}' canceled."}


@router.post("/clear")
def clear_all_faults(req: ClearFaultsRequest):
    """Clear all active faults on a station or across the entire network."""
    fault_injector.clear_all_faults(station_id=req.station_id)
    return {
        "status": "SUCCESS",
        "message": f"All faults cleared {'for station ' + req.station_id if req.station_id else 'universally'}.",
    }


@router.get("/active")
def get_active_faults(station_id: Optional[str] = None):
    """List all currently active faults."""
    return fault_injector.get_active_faults(station_id=station_id)
