import math
import logging
from typing import Dict, Any

logger = logging.getLogger("BallparkPhysicsEngine")

class BallparkPhysicsEngine:
    def __init__(self):
        self.R_dry = 287.058
        self.R_vapor = 461.495

    def calculate_true_air_density(self, temp_c: float, humidity_pct: float, pressure_hpa: float) -> float:
        temp_k = temp_c + 273.15
        pressure_pa = pressure_hpa * 100.0
        sat_vapor_press = 611.21 * math.exp((17.67 * temp_c) / (temp_c + 243.5))
        vapor_pressure = (humidity_pct / 100.0) * sat_vapor_press
        dry_air_pressure = pressure_pa - vapor_pressure
        air_density = (dry_air_pressure / (self.R_dry * temp_k)) + (vapor_pressure / (self.R_vapor * temp_k))
        return round(air_density, 4)

    def resolve_wind_vectors(self, wind_kph: float, wind_direction_deg: float, stadium_bearing_deg: float) -> Dict[str, float]:
        if wind_kph == 0:
            return {"tailwind_kph": 0.0, "crosswind_kph": 0.0}
        wind_toward_deg = (wind_direction_deg + 180.0) % 360.0
        relative_angle_rad = math.radians(wind_toward_deg - stadium_bearing_deg)
        tailwind = wind_kph * math.cos(relative_angle_rad)
        crosswind = wind_kph * math.sin(relative_angle_rad)
        return {"tailwind_kph": round(tailwind, 2), "crosswind_kph": round(crosswind, 2)}