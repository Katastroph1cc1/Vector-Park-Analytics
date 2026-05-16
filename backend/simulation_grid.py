import numpy as np
from typing import Dict, Any
from physics_engine import BallparkPhysicsEngine

STADIUM_OUTFIELDS = {
    "Wrigley Field": {"left_line": 355, "left_center": 368, "center": 400, "right_center": 368, "right_line": 353, "wall_height": 11.5},
    "Coors Field": {"left_line": 347, "left_center": 390, "center": 415, "right_center": 375, "right_line": 350, "wall_height": 10.0},
    "Yankee Stadium": {"left_line": 318, "left_center": 399, "center": 408, "right_center": 385, "right_line": 314, "wall_height": 8.0}
}

class MonteCarloSimulationGrid:
    def __init__(self, simulations_count: int = 10000):
        self.sim_count = simulations_count
        self.physics = BallparkPhysicsEngine()

    def run_batted_ball_projection(self, batter_data: Dict[str, Any], env_data: Dict[str, float], stadium_name: str) -> Dict[str, Any]:
        park_specs = STADIUM_OUTFIELDS.get(stadium_name, STADIUM_OUTFIELDS["Wrigley Field"])
        current_density = self.physics.calculate_true_air_density(env_data["air_temp_c"], env_data["relative_humidity_pct"], env_data["barometric_pressure_hpa"])
        density_ratio = current_density / 1.225
        
        wind_indices = self.physics.resolve_wind_vectors(env_data["wind_velocity_kph"], env_data["wind_azimuth_degrees"], 0.0)
        exit_velocities = np.random.normal(loc=batter_data['avg_hit_speed'], scale=4.5, size=self.sim_count)
        launch_angles = np.random.normal(loc=batter_data['avg_hit_angle'], scale=5.0, size=self.sim_count)
        spray_choices = np.random.choice(['left', 'center', 'right'], size=self.sim_count, p=[batter_data['pull_pct'], batter_data['center_pct'], batter_data['oppo_pct']])

        home_run_counter = 0
        distances_calculated = []

        for i in range(self.sim_count):
            ev, la, direction = exit_velocities[i], launch_angles[i], spray_choices[i]
            base_distance = (ev * 2.5) + (la * 1.8) if 10 < la < 40 else (ev * 1.5)
            adjusted_distance = base_distance * (1.0 - (density_ratio - 1.0) * 0.5) + (wind_indices["tailwind_kph"] * 0.75)
            distances_calculated.append(adjusted_distance)
            
            target_wall = park_specs["center"] if direction == "center" else (park_specs["left_center"] if direction == "left" else park_specs["right_center"])
            if adjusted_distance > target_wall:
                home_run_counter += 1

        return {
            "player": batter_data['player_name'], "venue": stadium_name, "simulations_run": self.sim_count,
            "average_projected_distance_ft": round(float(np.mean(distances_calculated)), 1),
            "maximum_projected_distance_ft": round(float(np.max(distances_calculated)), 1),
            "home_run_probability_pct": round((home_run_counter / self.sim_count) * 100, 2)
        }