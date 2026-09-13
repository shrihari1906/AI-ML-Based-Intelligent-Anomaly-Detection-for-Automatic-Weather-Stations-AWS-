"""
Server launcher for AI/ML AWS Anomaly Detection Prototype.
Starts the FastAPI application and serves the web dashboard at http://localhost:8000
"""

import uvicorn
import os
import sys

# Ensure project root is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import socket

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    local_ip = get_local_ip()
    print("=" * 70)
    print(">> ClimaSense - Climate + Intelligent Sensing")
    print("=" * 70)
    print(f">> Local Dashboard:   http://localhost:8000")
    print(f">> Network / LAN URL: http://{local_ip}:8000")
    print(f">> Swagger API Docs:  http://localhost:8000/docs")
    print(f">> Network API Docs:  http://{local_ip}:8000/docs")
    print("=" * 70)
    print(f">> Ready to accept sensor readings at POST http://{local_ip}:8000/data")
    print("=" * 70)
    
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
