"""
Model Training for Smart Logistics
Trains XGBRegressor (delay) + XGBClassifier (window miss).
Generates SHAP explanations.
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, f1_score, classification_report
from xgboost import XGBRegressor, XGBClassifier
import shap

from feature_engineering import load_all_data, build_features, get_feature_matrix, FEATURES

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')


def main():
    print("=" * 60)
    print("SMART LOGISTICS — Model Training")
    print("=" * 60)

    # Load data
    print("\n[1/5] Loading data...")
    routes, stops, traffic, weather, historical = load_all_data(DATA_DIR)
    print(f"  Routes: {len(routes)}, Stops: {len(stops)}, "
          f"Traffic: {len(traffic)}, Weather: {len(weather)}, "
          f"Historical: {len(historical)}")

    # Build features
    print("\n[2/5] Building features...")
    df = build_features(routes, stops, traffic, weather, historical)
    X, y_delay, y_window = get_feature_matrix(df)
    print(f"  Feature matrix: {X.shape[0]} samples × {X.shape[1]} features")
    print(f"  Features: {FEATURES}")

    # Train/test split
    X_train, X_test, y_delay_train, y_delay_test, y_window_train, y_window_test = \
        train_test_split(X, y_delay, y_window, test_size=0.2, random_state=42)
    print(f"  Train: {len(X_train)}, Test: {len(X_test)}")

    # ----- Model 1: Delay Regressor -----
    print("\n[3/5] Training delay regressor (XGBRegressor)...")
    model_delay = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
    )
    model_delay.fit(X_train, y_delay_train)

    y_pred_delay = model_delay.predict(X_test)
    mae = mean_absolute_error(y_delay_test, y_pred_delay)
    r2 = r2_score(y_delay_test, y_pred_delay)
    print(f"  MAE:  {mae:.2f} dk")
    print(f"  R²:   {r2:.4f}")

    # ----- Model 2: Window Classifier -----
    print("\n[4/5] Training window miss classifier (XGBClassifier)...")
    model_window = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss',
    )
    model_window.fit(X_train, y_window_train)

    y_pred_window = model_window.predict(X_test)
    acc = accuracy_score(y_window_test, y_pred_window)
    f1 = f1_score(y_window_test, y_pred_window, zero_division=0)
    print(f"  Accuracy: {acc:.4f}")
    print(f"  F1 Score: {f1:.4f}")
    print(f"\n  Classification Report:")
    print(classification_report(y_window_test, y_pred_window, zero_division=0))

    # ----- SHAP -----
    print("[5/5] Computing SHAP values...")
    explainer = shap.TreeExplainer(model_delay)
    shap_values = explainer.shap_values(X_test)
    print("  SHAP values computed successfully.")

    # Feature importance (mean |SHAP|)
    mean_shap = np.abs(shap_values).mean(axis=0)
    importance = sorted(zip(FEATURES, mean_shap), key=lambda x: -x[1])
    print("\n  Feature Importance (Mean |SHAP|):")
    for feat, val in importance:
        bar = "#" * int(val * 2)
        print(f"    {feat:30s} {val:8.3f}  {bar}")

    # ----- Save models -----
    os.makedirs(MODEL_DIR, exist_ok=True)
    delay_path = os.path.join(MODEL_DIR, 'delay_regressor.joblib')
    window_path = os.path.join(MODEL_DIR, 'window_classifier.joblib')

    joblib.dump(model_delay, delay_path)
    joblib.dump(model_window, window_path)
    print(f"\n  Models saved:")
    print(f"    {delay_path}")
    print(f"    {window_path}")

    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
