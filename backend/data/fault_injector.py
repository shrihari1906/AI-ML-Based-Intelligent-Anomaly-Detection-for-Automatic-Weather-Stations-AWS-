"""
Fault Injection Engine for Automatic Weather Stations.
Allows real-time interactive simulation of physical sensor faults, calibration drift, lockups, and telemetry drops.
"""

from typing import Dict, Any, Optional, List
import copy
import random
import time


class FaultInjector:
    def __init__(self):
        # Active faults indexed by station_id -> fault_id -> fault_config
        self.active_faults: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # Internal state counters for progressive faults (e.g. drift, flatline step counter)
        self.fault_states: Dict[str, Dict[str, Any]] = {}

    def inject_fault(
        self,
        station_id: str,
        fault_type: str,
        target_sensor: str,
        magnitude: float = 0.0,
        duration_steps: int = 50,
        description: str = "",
    ) -> str:
        """
        Inject a new fault into a station stream.
        fault_type: 'SPIKE' | 'FLATLINE' | 'DRIFT' | 'INCONSISTENCY' | 'OUT_OF_BOUNDS' | 'NOISE_BURST' | 'PACKET_LOSS'
        """
        if station_id not in self.active_faults:
            self.active_faults[station_id] = {}
            self.fault_states[station_id] = {}

        fault_id = f"{fault_type}_{target_sensor}_{int(time.time()*1000)%100000}"
        
        fault_config = {
            "fault_id": fault_id,
            "station_id": station_id,
            "fault_type": fault_type.upper(),
            "target_sensor": target_sensor,
            "magnitude": magnitude,
            "duration_steps": duration_steps,
            "steps_remaining": duration_steps,
            "description": description or f"Injected {fault_type} on {target_sensor}",
            "created_at": time.time(),
            "active": True,
        }
        
        self.active_faults[station_id][fault_id] = fault_config
        self.fault_states[station_id][fault_id] = {
            "step_count": 0,
            "locked_value": None,
        }
        return fault_id

    def remove_fault(self, station_id: str, fault_id: str) -> bool:
        """Cancel and remove an active fault."""
        if station_id in self.active_faults and fault_id in self.active_faults[station_id]:
            del self.active_faults[station_id][fault_id]
            if fault_id in self.fault_states.get(station_id, {}):
                del self.fault_states[station_id][fault_id]
            return True
        return False

    def clear_all_faults(self, station_id: Optional[str] = None):
        """Clear all faults for a specific station or universally."""
        if station_id:
            self.active_faults[station_id] = {}
            self.fault_states[station_id] = {}
        else:
            self.active_faults.clear()
            self.fault_states.clear()

    def get_active_faults(self, station_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return list of active fault configurations."""
        if station_id:
            return list(self.active_faults.get(station_id, {}).values())
        all_faults = []
        for station_f in self.active_faults.values():
            all_faults.extend(station_f.values())
        return all_faults

    def apply_faults(self, raw_reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform a clean simulated reading by applying active fault transformations.
        Returns reading with injected faults and metadata on active mutations.
        """
        reading = copy.deepcopy(raw_reading)
        station_id = reading.get("station_id", "AWS-001")
        
        if station_id not in self.active_faults or not self.active_faults[station_id]:
            reading["injected_faults"] = []
            return reading

        applied_faults_meta = []
        faults_to_remove = []

        for fault_id, config in list(self.active_faults[station_id].items()):
            if not config["active"] or config["steps_remaining"] <= 0:
                faults_to_remove.append(fault_id)
                continue

            target_sensor = config["target_sensor"]
            fault_type = config["fault_type"]
            mag = config["magnitude"]
            state = self.fault_states[station_id].setdefault(fault_id, {"step_count": 0, "locked_value": None})
            state["step_count"] += 1
            config["steps_remaining"] -= 1

            # 1. Spike / Impulse jump
            if fault_type == "SPIKE":
                if target_sensor in reading and reading[target_sensor] is not None:
                    reading[target_sensor] = round(reading[target_sensor] + mag, 2)

            # 2. Out of Bounds (Gross limit violation)
            elif fault_type == "OUT_OF_BOUNDS":
                if target_sensor in reading:
                    reading[target_sensor] = mag

            # 3. Flatline / Sensor Lockup
            elif fault_type == "FLATLINE":
                if target_sensor in reading and reading[target_sensor] is not None:
                    if state["locked_value"] is None:
                        state["locked_value"] = reading[target_sensor] if mag == 0 else mag
                    reading[target_sensor] = state["locked_value"]

            # 4. Calibration Drift (gradual offset over time)
            elif fault_type == "DRIFT":
                if target_sensor in reading and reading[target_sensor] is not None:
                    accumulated_drift = mag * state["step_count"]
                    reading[target_sensor] = round(reading[target_sensor] + accumulated_drift, 2)

            # 5. Cross-Sensor Physical Inconsistency
            elif fault_type == "INCONSISTENCY":
                if target_sensor == "dew_point" or target_sensor == "humidity":
                    # Force Dew Point higher than Dry Bulb Temp by +4°C
                    reading["dew_point"] = round(reading.get("temperature", 25.0) + 4.5, 2)
                    reading["humidity"] = 99.8
                elif target_sensor == "solar_radiation":
                    # Force 1000 W/m² at midnight or contradictory rain
                    reading["solar_radiation"] = 1050.0
                    reading["precipitation"] = 45.0
                elif target_sensor == "temperature":
                    # Sudden temperature extreme incompatible with high humidity
                    reading["temperature"] = 45.0
                    reading["humidity"] = 98.0
                    reading["solar_radiation"] = 950.0

            # 6. High-Frequency Noise Burst
            elif fault_type == "NOISE_BURST":
                if target_sensor in reading and reading[target_sensor] is not None:
                    noise = random.gauss(0, mag if mag != 0 else 6.0)
                    reading[target_sensor] = round(reading[target_sensor] + noise, 2)

            # 7. Telemetry Packet Loss
            elif fault_type == "PACKET_LOSS":
                if target_sensor in reading:
                    reading[target_sensor] = None

            applied_faults_meta.append({
                "fault_id": fault_id,
                "type": fault_type,
                "sensor": target_sensor,
                "description": config["description"],
                "steps_remaining": config["steps_remaining"]
            })

        for fid in faults_to_remove:
            self.remove_fault(station_id, fid)

        reading["injected_faults"] = applied_faults_meta
        return reading


# Global singleton instance
fault_injector = FaultInjector()
