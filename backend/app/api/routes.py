import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from fastapi import APIRouter
from pathlib import Path
import socket, time, psutil
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import traceback

router = APIRouter()

# Metrics route (working)
@router.get("/metrics")
def get_metrics():
    disk = psutil.disk_usage("/")
    return {
        "hostname": socket.gethostname(),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "ram_percent": psutil.virtual_memory().percent,
        "disk_percent": disk.percent,
        "total_disk": round(disk.total / (1024 ** 3), 2),
        "uptime_seconds": int(time.time() - psutil.boot_time()),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


