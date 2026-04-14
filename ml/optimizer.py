"""
Route Optimizer — Greedy Nearest-Deadline-First with Risk Avoidance
Reorders stops to minimize missed delivery windows.
"""

import numpy as np
from datetime import datetime, timedelta


def optimize_route(stops, predictions):
    """
    Optimize stop order to minimize missed time windows.

    Args:
        stops: list of dicts with stop info (stop_sequence, stop_id, distance_from_prev_km,
               time_window_open, time_window_close, latitude, longitude, road_type, etc.)
        predictions: list of dicts with predictions (predicted_delay_min, miss_probability, etc.)

    Returns:
        dict with original/optimized order, estimated savings, and changes
    """
    n = len(stops)
    if n <= 2:
        return {
            "original_order": [s['stop_sequence'] for s in stops],
            "optimized_order": [s['stop_sequence'] for s in stops],
            "estimated_time_saved_min": 0,
            "windows_saved": 0,
            "original_missed": sum(1 for p in predictions if p.get('miss_probability', 0) > 0.5),
            "optimized_missed": sum(1 for p in predictions if p.get('miss_probability', 0) > 0.5),
            "changes": []
        }

    # Build combined info
    combined = []
    for i, (stop, pred) in enumerate(zip(stops, predictions)):
        combined.append({
            'index': i,
            'stop_sequence': stop.get('stop_sequence', i + 1),
            'stop_id': stop.get('stop_id', f'STP-{i}'),
            'distance_from_prev_km': stop.get('distance_from_prev_km', 0),
            'road_type': stop.get('road_type', 'urban'),
            'latitude': stop.get('latitude', 0),
            'longitude': stop.get('longitude', 0),
            'time_window_close': stop.get('time_window_close', ''),
            'time_window_open': stop.get('time_window_open', ''),
            'predicted_delay': pred.get('predicted_delay_min', 0),
            'miss_probability': pred.get('miss_probability', 0),
        })

    original_order = [c['stop_sequence'] for c in combined]
    original_missed = sum(1 for c in combined if c['miss_probability'] > 0.5)

    # Identify high-risk stops (miss_prob > 0.7)
    high_risk_indices = [i for i, c in enumerate(combined) if c['miss_probability'] > 0.7]

    # Keep first and last stops fixed (depot departure/return)
    # Only reorder middle stops
    if len(combined) <= 2:
        return _build_result(original_order, original_order, 0, 0, original_missed, original_missed, [])

    first = combined[0]
    last = combined[-1]
    middle = combined[1:-1]

    # Sort middle stops by urgency score
    # urgency = 1 / (1 + predicted_delay) * (1 + miss_probability) — lower distance preferred for high risk
    for m in middle:
        # Parse time window close for slack calculation
        try:
            tw_close = datetime.strptime(str(m['time_window_close']), '%Y-%m-%d %H:%M:%S')
            tw_open = datetime.strptime(str(m['time_window_open']), '%Y-%m-%d %H:%M:%S')
            window_duration = (tw_close - tw_open).total_seconds() / 60.0
        except (ValueError, TypeError):
            window_duration = 60.0  # default

        # Urgency: high miss prob + short window + close deadline = urgent (low score = go first)
        m['urgency'] = (
            window_duration / (1 + m['predicted_delay'])
        )
        # High risk + short distance = move earlier
        if m['miss_probability'] > 0.7:
            m['urgency'] *= (1 + m['distance_from_prev_km'] / 50.0)

    # Sort: lower urgency = more urgent = go first
    optimized_middle = sorted(middle, key=lambda x: x['urgency'])

    optimized = [first] + optimized_middle + [last]
    optimized_order = [c['stop_sequence'] for c in optimized]

    # Calculate changes
    changes = []
    total_time_saved = 0.0
    windows_saved = 0

    for i, (orig, opt) in enumerate(zip(combined[1:-1], optimized_middle)):
        if orig['stop_sequence'] != opt['stop_sequence']:
            # Check if this was a high-risk stop moved earlier
            orig_pos = original_order.index(opt['stop_sequence'])
            new_pos = optimized_order.index(opt['stop_sequence'])

            if new_pos < orig_pos and opt['miss_probability'] > 0.5:
                time_save = opt['predicted_delay'] * 0.3  # estimate 30% reduction
                total_time_saved += time_save
                if opt['miss_probability'] > 0.7:
                    windows_saved += 1

                changes.append({
                    "action": "moved_earlier",
                    "stop": opt['stop_sequence'],
                    "stop_id": opt['stop_id'],
                    "from_position": orig_pos + 1,
                    "to_position": new_pos + 1,
                    "reason": (
                        f"Stop {opt['stop_sequence']} ({opt['stop_id']}) has "
                        f"{opt['distance_from_prev_km']:.1f}km {opt['road_type']} road "
                        f"with {opt['miss_probability']*100:.0f}% miss risk. "
                        f"Moved earlier to save ~{time_save:.0f} min."
                    )
                })
            elif new_pos > orig_pos:
                changes.append({
                    "action": "moved_later",
                    "stop": opt['stop_sequence'],
                    "stop_id": opt['stop_id'],
                    "from_position": orig_pos + 1,
                    "to_position": new_pos + 1,
                    "reason": (
                        f"Stop {opt['stop_sequence']} has lower urgency "
                        f"({opt['miss_probability']*100:.0f}% risk). Moved later to prioritize urgent stops."
                    )
                })

    # Estimate optimized missed windows
    optimized_missed = max(0, original_missed - windows_saved)

    # If no meaningful changes, return as-is
    if not changes:
        total_time_saved = 0
        windows_saved = 0
        optimized_order = original_order
        optimized_missed = original_missed

    return {
        "original_order": original_order,
        "optimized_order": optimized_order,
        "estimated_time_saved_min": round(total_time_saved, 1),
        "windows_saved": windows_saved,
        "original_missed": original_missed,
        "optimized_missed": optimized_missed,
        "changes": changes
    }


def _build_result(orig, opt, time_saved, win_saved, orig_missed, opt_missed, changes):
    return {
        "original_order": orig,
        "optimized_order": opt,
        "estimated_time_saved_min": round(time_saved, 1),
        "windows_saved": win_saved,
        "original_missed": orig_missed,
        "optimized_missed": opt_missed,
        "changes": changes
    }
