"""Prediction service — loads trained models and makes predictions with SHAP explanations."""

import os
import sys
import warnings
import numpy as np
import pandas as pd

# Add ml/ to path for feature_engineering
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
ML_DIR = os.path.join(_PROJECT_DIR, 'ml')
MODEL_DIR = os.path.join(ML_DIR, 'models')
sys.path.insert(0, ML_DIR)

from feature_engineering import build_features, get_feature_matrix, FEATURES, load_all_data
from services.data_service import load_routes, load_stops, load_traffic, load_weather, load_historical, DATA_DIR

# Load models at import time (with graceful fallback)
delay_model = None
window_model = None
shap_explainer = None

try:
    import joblib
    import shap

    delay_path = os.path.join(MODEL_DIR, 'delay_regressor.joblib')
    window_path = os.path.join(MODEL_DIR, 'window_classifier.joblib')

    if os.path.exists(delay_path):
        delay_model = joblib.load(delay_path)
        shap_explainer = shap.TreeExplainer(delay_model)
        print(f"[INFO] Delay model loaded from {delay_path}")
    else:
        warnings.warn(f"Delay model not found at {delay_path}. Predictions will use fallback.")

    if os.path.exists(window_path):
        window_model = joblib.load(window_path)
        print(f"[INFO] Window model loaded from {window_path}")
    else:
        warnings.warn(f"Window model not found at {window_path}. Predictions will use fallback.")

except Exception as e:
    warnings.warn(f"Failed to load models: {e}. Using fallback predictions.")


def _risk_level(delay):
    if delay < 10:
        return "low"
    elif delay <= 30:
        return "medium"
    else:
        return "high"


def predict_for_route(route_id: str):
    """
    Generate predictions for all stops in a route.
    Returns list of prediction dicts.
    """
    routes_df = load_routes()
    stops_df = load_stops()
    traffic_df = load_traffic()
    weather_df = load_weather()
    historical_df = load_historical()

    # Filter stops for this route
    route_stops = stops_df[stops_df['route_id'] == route_id].copy()
    if route_stops.empty:
        return []

    # Build full feature matrix
    df = build_features(routes_df, route_stops, traffic_df, weather_df, historical_df)

    if df.empty:
        return []

    X, _, _ = get_feature_matrix(df)

    predictions = []

    if delay_model is not None and window_model is not None:
        # Use ML models
        delay_preds = delay_model.predict(X)
        delay_preds = np.maximum(delay_preds, 0)  # No negative delays

        window_probs = window_model.predict_proba(X)[:, 1] if hasattr(window_model, 'predict_proba') else window_model.predict(X).astype(float)

        # SHAP explanations
        shap_values = None
        if shap_explainer is not None:
            try:
                shap_values = shap_explainer.shap_values(X)
            except Exception:
                pass

        for i, (_, row) in enumerate(df.iterrows()):
            top_factors = []
            if shap_values is not None:
                shap_row = shap_values[i]
                # Top 3 features by absolute SHAP value
                top_idx = np.argsort(np.abs(shap_row))[-3:][::-1]
                for idx in top_idx:
                    top_factors.append({
                        "feature": FEATURES[idx],
                        "impact": round(float(shap_row[idx]), 2)
                    })

            pred_delay = float(delay_preds[i])
            miss_prob = float(window_probs[i])

            predictions.append({
                "stop_id": row.get('stop_id', ''),
                "stop_sequence": int(row.get('stop_sequence', i + 1)),
                "predicted_delay_min": round(pred_delay, 1),
                "miss_probability": round(miss_prob, 3),
                "risk_level": _risk_level(pred_delay),
                "top_factors": top_factors
            })
    else:
        # Fallback: use existing delay_probability from data
        for _, row in df.iterrows():
            delay = float(row.get('delay_at_stop_min', 0))
            prob = float(row.get('delay_probability', 0.5))
            predictions.append({
                "stop_id": row.get('stop_id', ''),
                "stop_sequence": int(row.get('stop_sequence', 0)),
                "predicted_delay_min": round(delay, 1),
                "miss_probability": round(prob, 3),
                "risk_level": _risk_level(delay),
                "top_factors": [{"feature": "fallback", "impact": 0}]
            })

    # Sort by stop_sequence
    predictions.sort(key=lambda x: x['stop_sequence'])
    return predictions
