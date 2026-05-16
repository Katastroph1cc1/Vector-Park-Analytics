import logging
import requests
from datetime import datetime
from typing import Dict, List, Optional, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("BallparkAnalyticsScout")

VENUE_REGISTRY: Dict[str, Dict[str, float]] = {
    "Yankee Stadium": {"lat": 40.8296, "lon": -73.9262, "centerfield_bearing": 67.5},
    "Fenway Park": {"lat": 42.3467, "lon": -71.0972, "centerfield_bearing": 45.0},
    "Coors Field": {"lat": 39.7559, "lon": -104.9942, "centerfield_bearing": 35.0},
    "Wrigley Field": {"lat": 41.9484, "lon": -87.6553, "centerfield_bearing": 0.0},
}

class BallparkDataScout:
    def __init__(self):
        self.mlb_api_url = "http://statsapi.mlb.com/api/v1/schedule"
        self.weather_api_url = "https://api.open-meteo.com/v1/forecast"

    def scout_daily_slate(self) -> List[Dict[str, Any]]:
        today_date = datetime.today().strftime('%Y-%m-%d')
        params = {"sportId": 1, "date": today_date}
        try:
            logger.info(f"Scouting the daily MLB slate for date: {today_date}")
            response = requests.get(self.mlb_api_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            if "dates" not in data or not data["dates"]:
                return []
            games_payload = data["dates"][0].get("games", [])
            parsed_slate: List[Dict[str, Any]] = []
            for game in games_payload:
                parsed_slate.append({
                    "game_id": game.get("gamePk"),
                    "first_pitch_utc": game.get("gameDate"),
                    "away_club": game["teams"]["away"]["team"]["name"],
                    "home_club": game["teams"]["home"]["team"]["name"],
                    "venue_name": game["venue"]["name"]
                })
            return parsed_slate
        except requests.RequestException as error:
            logger.error(f"Scouting report failed: {error}")
            return []

    def fetch_environmental_overlay(self, lat: float, lon: float, first_pitch_utc: str) -> Optional[Dict[str, float]]:
        try:
            date_isolated = first_pitch_utc.split("T")[0]
            first_pitch_hour_utc = int(first_pitch_utc.split("T")[1].split(":")[0])
            params = {
                "latitude": lat, "longitude": lon,
                "hourly": "temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m",
                "start_date": date_isolated, "end_date": date_isolated
            }
            response = requests.get(self.weather_api_url, params=params, timeout=10)
            response.raise_for_status()
            weather_data = response.json()["hourly"]
            return {
                "air_temp_c": float(weather_data["temperature_2m"][first_pitch_hour_utc]),
                "relative_humidity_pct": float(weather_data["relative_humidity_2m"][first_pitch_hour_utc]),
                "barometric_pressure_hpa": float(weather_data["surface_pressure"][first_pitch_hour_utc]),
                "wind_velocity_kph": float(weather_data["wind_speed_10m"][first_pitch_hour_utc]),
                "wind_azimuth_degrees": float(weather_data["wind_direction_10m"][first_pitch_hour_utc])
            }
        except Exception as error:
            logger.error(f"Weather scout error: {error}")
            return None