# Smart Logistics — Real-time Delivery Route Optimization

**Anadolu Hackathon 2026 | Case #1 — Sivas Smart Logistik System**

## Problem

Current delivery planning uses fixed speed assumptions (highway=90, urban=40 km/h).
Reality: vehicles travel at roughly **HALF** the planned speed due to traffic, weather,
and incidents. Result: **only 14.6% of deliveries arrive on time** and **85.6% of delivery windows are missed**.

## Solution

AI-powered system that:
1. **Predicts** delay at each stop using XGBoost (traffic + weather + road + historical data)
2. **Recommends** stop reordering to minimize missed delivery windows
3. **Visualizes** risks and suggestions on a dispatcher-friendly map dashboard

## Key Results

| Metric | Value |
|--------|-------|
| Delay prediction MAE | **3.08 minutes** |
| Delay prediction R2 | **0.959** |
| Window miss classifier accuracy | **94.5%** |
| Window miss F1 score | **0.968** |
| Top predictive feature | `hist_delay_prob` (historical delay probability) |
| 2nd top feature | `distance_from_prev_km` |

## Architecture

```
CSV Data --> Feature Engineering (17 features)
                |
                v
         XGBoost Models (Regressor + Classifier)
                |
                v
         FastAPI Backend (/api/predict, /api/optimize)
                |
                v
         React Dashboard (Leaflet Map + Recharts + Tailwind)
```

## Tech Stack

- **ML**: Python, XGBoost, SHAP (explainability), scikit-learn
- **Backend**: FastAPI, Pandas, joblib
- **Frontend**: React 18, Vite, Leaflet (react-leaflet), Recharts, Tailwind CSS v4
- **Deploy**: Docker Compose

## Quick Start

### 1. Model Training
```bash
cd ml
pip install -r requirements.txt
python train_model.py
```

### 2. Docker ile Calistirma
```bash
docker-compose up --build
```

### 3. Veya ayri ayri:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | List all routes |
| GET | `/api/routes/{route_id}` | Route details with stops |
| POST | `/api/predict` | Predict delay for all stops in a route |
| POST | `/api/optimize` | Optimize stop order for a route |
| GET | `/api/stats/overview` | Dashboard overview statistics |
| GET | `/api/weather/current` | Weather observations |
| GET | `/api/traffic/segments` | Traffic segment data |

## Feature Engineering (17 Features)

**Current conditions (64% importance):**
- `distance_from_prev_km`, `road_type_enc`, `traffic_level_enc`, `weather_condition_enc`
- `temperature_c`, `precipitation_mm`, `wind_speed_kmh`, `visibility_km`, `humidity_pct`
- `road_incident`, `incident_severity`, `hour`, `stop_sequence`, `package_weight_kg`

**Historical experience (36% importance):**
- `hist_mean_delay`, `hist_delay_prob`, `hist_p90_delay`

## SHAP Explainability

Every prediction comes with top-3 SHAP factors explaining **why** the delay was predicted.
This is critical for dispatcher trust — not just "55 min delay" but "because: 63km mountain road + traffic incident + historical high delay probability".

## Data

Synthetic dataset simulating delivery logistics in **Sivas, Turkey** (39.2-39.8 N, 36.8-37.4 E).
- 200 routes, 1451 stops, 500 traffic segments, 300 weather observations, 480 historical stats
- Inspired by Yandex Shifts dataset structure
