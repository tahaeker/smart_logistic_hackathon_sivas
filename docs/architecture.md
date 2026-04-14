# Smart Logistics Architecture

## System Overview

```
[CSV Data Files]
    |
    v
[ML Pipeline] -- feature_engineering.py --> 17 features
    |                                         |
    | train_model.py                          |
    v                                         v
[XGBoost Models]                    [Feature Builder]
  - delay_regressor.joblib              |
  - window_classifier.joblib            |
    |                                   |
    v                                   v
[FastAPI Backend]
  - /api/routes          --> data_service.py (CSV cache)
  - /api/predict         --> prediction_service.py (Model + SHAP)
  - /api/optimize        --> optimization_service.py (Greedy reorder)
  - /api/stats/overview
  - /api/weather/current
  - /api/traffic/segments
    |
    v
[React Frontend]
  - MapView (Leaflet)    --> Sivas region, stop markers, route lines
  - RouteSelector        --> Dropdown, 200 routes
  - RouteStats           --> 4 stat cards
  - AlertPanel           --> High-risk stop warnings
  - OptimizationPanel    --> Reorder suggestions
  - DelayChart           --> Bar chart per stop
```

## ML Pipeline Details

### Feature Engineering
- Merges route_stops + routes on route_id
- Extracts hour and time_bucket from planned_arrival
- Left-joins historical_delay_stats for baseline predictions
- Encodes categoricals (road_type, weather, traffic, vehicle)

### Model Training
- XGBRegressor: 300 trees, depth 6, lr 0.1 --> MAE 3.08 min, R2 0.959
- XGBClassifier: 200 trees, depth 5 --> Accuracy 94.5%, F1 0.968
- SHAP TreeExplainer for per-prediction explanations

### Optimization Algorithm
Greedy Nearest-Deadline-First with Risk Avoidance:
1. Calculate urgency score per stop
2. Identify high-risk stops (miss_prob > 0.7)
3. Move short-distance urgent stops earlier
4. Move long-distance less-urgent stops later
5. Estimate time savings and windows saved
