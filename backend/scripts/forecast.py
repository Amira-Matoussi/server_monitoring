import os
import pandas as pd
import numpy as np
import json

from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path


def get_supabase_client():
    env_path = Path(__file__).resolve().parents[2] / ".env.local"  # ✅ one level up
    load_dotenv(dotenv_path=env_path)

    SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase credentials not found in .env.local")

    return create_client(SUPABASE_URL, SUPABASE_KEY)


def forecast(series):
    if len(series) < 5:  # ⏳ LOWERED for testing — set back to 30 for production
        return None

    X = np.arange(len(series)).reshape(-1, 1)
    y = series.values.reshape(-1, 1)

    model = LinearRegression()
    model.fit(X, y)

    X_future = np.arange(len(series), len(series) + 60).reshape(-1, 1)
    return model.predict(X_future).flatten()


def run_forecast():
    supabase = get_supabase_client()

    metrics_resp = supabase.table("server_metrics").select("*").order("recorded_at", desc=True).limit(5000).execute()
    servers_resp = supabase.table("servers").select("id, name").execute()

    metrics_df = pd.DataFrame(metrics_resp.data)
    servers_df = pd.DataFrame(servers_resp.data)

    print("📦 Metrics rows:", len(metrics_df))
    print("🖥️ Servers rows:", len(servers_df))

    if metrics_df.empty or servers_df.empty:
        print("⚠️ No data found for forecasting.")
        return []

    data = metrics_df.merge(servers_df, left_on="server_id", right_on="id", suffixes=("_metric", "_server"))
    print("🔗 Merged rows:", len(data))
    print("🧠 Servers found:", data['name'].unique())

    data["recorded_at"] = pd.to_datetime(data["recorded_at"])
    data.sort_values("recorded_at", inplace=True)
    data.set_index("recorded_at", inplace=True)

    # Uncomment to filter recent data only
    # cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    # data = data[data.index > cutoff]

    results = []

    for name in data["name"].unique():
        df = data[data["name"] == name]
        print(f"\n🔍 Forecasting for server: {name}")
        print("📊 Raw rows:", len(df))

        if df.empty:
            print("⛔ Skipped: empty dataframe.")
            continue

        try:
            cpu_ts = df["cpu"].resample("1min").mean().ffill()
            ram_ts = df["ram"].resample("1min").mean().ffill()
        except Exception as e:
            print(f"⚠️ Error resampling data for {name}:", e)
            continue

        print("📈 Resampled CPU points:", len(cpu_ts))
        print("📈 Resampled RAM points:", len(ram_ts))

        cpu_forecast = forecast(cpu_ts)
        ram_forecast = forecast(ram_ts)

        if cpu_forecast is None or ram_forecast is None:
            print("⛔ Skipped: not enough data for forecasting.")
            continue

        print("✅ Forecast OK")

        results.append({
            "server": str(name),
            "cpu_forecast_max": float(round(cpu_forecast.max(), 2)),
            "cpu_forecast_avg": float(round(cpu_forecast.mean(), 2)),
            "ram_forecast_max": float(round(ram_forecast.max(), 2)),
            "ram_forecast_avg": float(round(ram_forecast.mean(), 2)),
            "cpu_alert": bool(cpu_forecast.max() > 80),
            "ram_alert": bool(ram_forecast.max() > 80),
        })

    print(f"\n📤 Final forecast result count: {len(results)}")
    return results

if __name__ == "__main__":
    results = run_forecast()

    output_path = Path(__file__).resolve().parent / "forecast_results.json"

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n💾 Forecast results saved to: {output_path}")