"""
test_feed.py — Simulates a live sensor feed for demo purposes.

Reads rows from clean_weather_data.csv one at a time and POSTs each
to POST /data with a short delay between requests.

Usage:
    python test_feed.py                          # default: 0.5s delay
    python test_feed.py --delay 0.2              # faster
    python test_feed.py --url http://host:8000   # custom server URL
"""

import csv
import json
import time
import urllib.request
import urllib.error
import argparse
import os


def main():
    parser = argparse.ArgumentParser(description="AWS sensor feed simulator")
    parser.add_argument("--delay", type=float, default=0.5,
                        help="Seconds between readings (default: 0.5)")
    parser.add_argument("--url", default="http://127.0.0.1:8000",
                        help="Base URL of the API server")
    parser.add_argument("--csv", default="clean_weather_data.csv",
                        help="Path to the CSV file")
    args = parser.parse_args()

    csv_path = args.csv
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(os.path.dirname(__file__), csv_path)

    endpoint = f"{args.url}/api/reading"

    print(f"=== AWS Sensor Feed Simulator ===")
    print(f"Server : {args.url}")
    print(f"CSV    : {csv_path}")
    print(f"Delay  : {args.delay}s")
    print(f"{'='*50}\n")

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Loaded {len(rows)} readings. Starting feed...\n")

    for i, row in enumerate(rows, start=1):
        payload = {
            "station_id": row["station_id"],
            "timestamp": row["timestamp"],
            "temperature": float(row["temperature"]),
            "humidity": float(row["humidity"]),
            "pressure": float(row["pressure"]),
            "wind_speed": float(row["wind_speed"]),
        }

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                endpoint, data=data,
                headers={"Content-Type": "application/json"},
            )
            resp = urllib.request.urlopen(req)
            body = json.loads(resp.read().decode("utf-8"))

            anomaly = body.get("anomaly", {})
            flag = "ANOMALY" if anomaly.get("is_anomaly") else "ok"
            score = anomaly.get("score", 0)
            reason = anomaly.get("reason", "")

            print(f"[{i:3d}/{len(rows)}] {payload['station_id']} "
                  f"{payload['timestamp']}  "
                  f"T={payload['temperature']:5.1f}  "
                  f"H={payload['humidity']:5.1f}  "
                  f"=> {flag:8s} score={score:.4f}  {reason}")

        except urllib.error.HTTPError as e:
            print(f"[{i:3d}/{len(rows)}] HTTP {e.code}: {e.read().decode()}")
        except Exception as e:
            print(f"[{i:3d}/{len(rows)}] ERROR: {e}")

        if i < len(rows):
            time.sleep(args.delay)

    print(f"\n{'='*50}")
    print(f"Feed complete. Sent {len(rows)} readings.")
    print(f"Check alerts:   GET {args.url}/api/alerts")
    print(f"Check readings: GET {args.url}/api/readings/AWS_01")


if __name__ == "__main__":
    main()
