"""
Feature Engineering for Smart Logistics Delay Prediction
Builds 17 features from route, stop, traffic, weather, and historical data.
"""

import pandas as pd
import numpy as np

FEATURES = [
    'distance_from_prev_km',
    'road_type_enc',
    'traffic_level_enc',
    'weather_condition_enc',
    'temperature_c',
    'precipitation_mm',
    'wind_speed_kmh',
    'visibility_km',
    'humidity_pct',
    'road_incident',
    'incident_severity',
    'hour',
    'stop_sequence',
    'package_weight_kg',
    'hist_mean_delay',
    'hist_delay_prob',
    'hist_p90_delay',
]

ROAD_TYPE_MAP = {'highway': 0, 'rural': 1, 'urban': 2, 'mountain': 3}
WEATHER_MAP = {'clear': 0, 'cloudy': 1, 'wind': 2, 'fog': 3, 'rain': 4, 'snow': 5}
TRAFFIC_MAP = {'low': 0, 'moderate': 1, 'high': 2, 'congested': 3}
VEHICLE_MAP = {'car': 0, 'motorcycle': 1, 'van': 2, 'truck': 3}


def _hour_to_bucket(h):
    if 7 <= h <= 9:
        return 'morning_rush'
    elif 10 <= h <= 15:
        return 'midday'
    elif 16 <= h <= 19:
        return 'evening_rush'
    elif 20 <= h <= 23:
        return 'night'
    else:
        return 'early_morning'


def build_features(routes_df, stops_df, traffic_df, weather_df, historical_df):
    """
    Build feature matrix from all data sources.

    Returns:
        df: DataFrame with FEATURES columns + target columns
    """
    # 1. Merge stops with routes on route_id
    df = stops_df.merge(routes_df, on='route_id', how='inner', suffixes=('', '_route'))

    # 2. Extract hour from planned_arrival
    df['planned_arrival'] = pd.to_datetime(df['planned_arrival'], errors='coerce')
    df['hour'] = df['planned_arrival'].dt.hour

    # 3. Derive time_bucket from hour
    df['time_bucket'] = df['hour'].apply(_hour_to_bucket)

    # 4. Merge historical delay stats (left join on 4 keys)
    hist = historical_df.rename(columns={
        'mean_delay_min': 'hist_mean_delay',
        'delay_probability': 'hist_delay_prob',
        'p90_delay_min': 'hist_p90_delay',
    })

    df = df.merge(
        hist[['road_type', 'traffic_level', 'weather_condition', 'time_bucket',
              'hist_mean_delay', 'hist_delay_prob', 'hist_p90_delay']],
        on=['road_type', 'traffic_level', 'weather_condition', 'time_bucket'],
        how='left'
    )

    # 5. Encode categorical variables
    df['road_type_enc'] = df['road_type'].map(ROAD_TYPE_MAP).fillna(0).astype(int)
    df['weather_condition_enc'] = df['weather_condition'].map(WEATHER_MAP).fillna(0).astype(int)
    df['traffic_level_enc'] = df['traffic_level'].map(TRAFFIC_MAP).fillna(0).astype(int)
    df['vehicle_type_enc'] = df['vehicle_type'].map(VEHICLE_MAP).fillna(0).astype(int)

    # 6. Fill NaN in hist_ columns with 0
    for col in ['hist_mean_delay', 'hist_delay_prob', 'hist_p90_delay']:
        df[col] = df[col].fillna(0)

    return df


def get_feature_matrix(df):
    """Extract X (features) and y (targets) from built dataframe."""
    X = df[FEATURES].copy()
    X = X.fillna(0)
    y_delay = df['delay_at_stop_min'].fillna(0)
    y_window = df['missed_time_window'].fillna(0).astype(int)
    return X, y_delay, y_window


def load_all_data(data_dir='../data'):
    """Load all CSV files from data directory."""
    routes = pd.read_csv(f'{data_dir}/routes.csv')
    stops = pd.read_csv(f'{data_dir}/route_stops.csv')
    traffic = pd.read_csv(f'{data_dir}/traffic_segments.csv')
    weather = pd.read_csv(f'{data_dir}/weather_observations.csv')
    historical = pd.read_csv(f'{data_dir}/historical_delay_stats.csv')
    return routes, stops, traffic, weather, historical
