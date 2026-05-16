# Vector Park Analytics

A high-performance full-stack web application designed to compute microclimate-adjusted batted ball trajectories and Home Run probabilities using a 10,000-run Monte Carlo simulation engine.

## Stack Architecture
- **Backend:** Python (FastAPI, Uvicorn, Pandas, NumPy, Requests) pulling live MLB boxscores, ballpark spatial constraints, and direct Statcast metrics.
- **Frontend:** React (Vite, Tailwind CSS, Lucide Icons) rendering real-time responsive dashboards with imperial conversion controls.
