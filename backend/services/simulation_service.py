"""Simulation service — runs what-if predictions with per-stop condition overrides."""

import os
import sys
import warnings
import numpy as np

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
ML_DIR = os.path.join(_PROJECT_DIR, 'ml')
sys.path.insert(0, ML_DIR)

from feature_engineering import build_features, get_feature_matrix, FEATURES, WEATHER_MAP, TRAFFIC_MAP
from services.data_service import load_routes, load_stops, load_traffic, load_weather, load_historical
from services.prediction_service import delay_model, window_model, shap_explainer, _risk_level


# Maps override field names to feature DataFrame column names
_CATEGORICAL_OVERRIDE_MAP = {
    "traffic_level":     ("traffic_level_enc",    TRAFFIC_MAP),
    "weather_condition": ("weather_condition_enc", WEATHER_MAP),
}

_NUMERIC_OVERRIDE_MAP = {
    "temperature_c":    "temperature_c",
    "precipitation_mm": "precipitation_mm",
    "wind_speed_kmh":   "wind_speed_kmh",
    "visibility_km":    "visibility_km",
    "humidity_pct":     "humidity_pct",
    "road_incident":    "road_incident",
    "incident_severity":"incident_severity",
}


def _apply_overrides(df, overrides):
    """Mutate df in-place: apply condition overrides to matching stop rows."""
    override_by_seq = {o.stop_sequence: o for o in overrides}

    for idx, row in df.iterrows():
        seq = int(row["stop_sequence"])
        if seq not in override_by_seq:
            continue
        override = override_by_seq[seq]

        # Categorical fields: translate label → encoded int
        for field, (enc_col, mapping) in _CATEGORICAL_OVERRIDE_MAP.items():
            value = getattr(override, field, None)
            if value is not None:
                encoded = mapping.get(value)
                if encoded is None:
                    raise ValueError(
                        f"Geçersiz {field} değeri '{value}'. "
                        f"İzin verilenler: {list(mapping.keys())}"
                    )
                df.at[idx, enc_col] = encoded

        # Numeric / boolean fields: write directly
        for field, col in _NUMERIC_OVERRIDE_MAP.items():
            value = getattr(override, field, None)
            if value is not None:
                df.at[idx, col] = int(value) if isinstance(value, bool) else value


def _run_predictions(X, df):
    """Run ML models on feature matrix X, return list of prediction dicts."""
    predictions = []

    if delay_model is not None and window_model is not None:
        delay_preds = np.maximum(delay_model.predict(X), 0)

        window_probs = (
            window_model.predict_proba(X)[:, 1]
            if hasattr(window_model, "predict_proba")
            else window_model.predict(X).astype(float)
        )

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
                top_idx = np.argsort(np.abs(shap_row))[-3:][::-1]
                top_factors = [
                    {"feature": FEATURES[j], "impact": round(float(shap_row[j]), 2)}
                    for j in top_idx
                ]

            predictions.append({
                "stop_id": row.get("stop_id", ""),
                "stop_sequence": int(row.get("stop_sequence", i + 1)),
                "predicted_delay_min": round(float(delay_preds[i]), 1),
                "miss_probability": round(float(window_probs[i]), 3),
                "risk_level": _risk_level(float(delay_preds[i])),
                "top_factors": top_factors,
            })
    else:
        # Fallback: use raw CSV values
        for _, row in df.iterrows():
            delay = float(row.get("delay_at_stop_min", 0))
            prob = float(row.get("delay_probability", 0.5))
            predictions.append({
                "stop_id": row.get("stop_id", ""),
                "stop_sequence": int(row.get("stop_sequence", 0)),
                "predicted_delay_min": round(delay, 1),
                "miss_probability": round(prob, 3),
                "risk_level": _risk_level(delay),
                "top_factors": [],
            })

    predictions.sort(key=lambda x: x["stop_sequence"])
    return predictions


def simulate_for_route(route_id: str, overrides: list) -> dict:
    """
    Run baseline predictions + simulated predictions with overrides applied.
    Returns combined result dict matching SimulationResponse schema.
    """
    routes_df = load_routes()
    stops_df = load_stops()
    traffic_df = load_traffic()
    weather_df = load_weather()
    hist_df = load_historical()

    route_stops = stops_df[stops_df["route_id"] == route_id].copy()
    if route_stops.empty:
        return {}

    # Validate override sequences
    df_check = build_features(routes_df, route_stops, traffic_df, weather_df, hist_df)
    if df_check.empty:
        return {}

    valid_seqs = set(df_check["stop_sequence"].astype(int).tolist())
    for o in overrides:
        if o.stop_sequence not in valid_seqs:
            raise ValueError(
                f"stop_sequence {o.stop_sequence} bu rotada yok. "
                f"Geçerli sequence'lar: {sorted(valid_seqs)}"
            )

    # Baseline predictions
    X_base, _, _ = get_feature_matrix(df_check)
    base_preds = _run_predictions(X_base, df_check)

    # Simulated predictions (fresh copy of feature df + overrides applied)
    df_sim = build_features(routes_df, route_stops, traffic_df, weather_df, hist_df)
    _apply_overrides(df_sim, overrides)
    X_sim, _, _ = get_feature_matrix(df_sim)
    sim_preds = _run_predictions(X_sim, df_sim)

    # Merge side-by-side
    base_by_seq = {p["stop_sequence"]: p for p in base_preds}
    sim_by_seq = {p["stop_sequence"]: p for p in sim_preds}

    stops_result = []
    for seq in sorted(base_by_seq.keys()):
        b = base_by_seq[seq]
        s = sim_by_seq[seq]
        stops_result.append({
            "stop_id": b["stop_id"],
            "stop_sequence": seq,
            "original_delay_min": b["predicted_delay_min"],
            "original_miss_probability": b["miss_probability"],
            "original_risk_level": b["risk_level"],
            "simulated_delay_min": s["predicted_delay_min"],
            "simulated_miss_probability": s["miss_probability"],
            "simulated_risk_level": s["risk_level"],
            "delta_delay_min": round(s["predicted_delay_min"] - b["predicted_delay_min"], 1),
            "top_factors": s["top_factors"],
        })

    orig_delays = [b["predicted_delay_min"] for b in base_preds]
    sim_delays = [s["predicted_delay_min"] for s in sim_preds]
    orig_missed = sum(1 for b in base_preds if b["miss_probability"] >= 0.5)
    sim_missed = sum(1 for s in sim_preds if s["miss_probability"] >= 0.5)
    orig_avg = round(sum(orig_delays) / len(orig_delays), 1) if orig_delays else 0.0
    sim_avg = round(sum(sim_delays) / len(sim_delays), 1) if sim_delays else 0.0

    return {
        "route_id": route_id,
        "stops": stops_result,
        "original_avg_delay_min": orig_avg,
        "simulated_avg_delay_min": sim_avg,
        "original_missed_windows": orig_missed,
        "simulated_missed_windows": sim_missed,
        "delta_avg_delay_min": round(sim_avg - orig_avg, 1),
    }
