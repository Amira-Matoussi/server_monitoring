import os
import uuid
import socket
import datetime
import platform
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import sys
from PIL import UnidentifiedImageError  # Handle corrupted images
from duplicate_scanner_model import get_image_embedding  # type: ignore

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env.local")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in .env.local")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_server_id_from_hostname():
    hostname = socket.gethostname()
    response = supabase.table("servers").select("id").eq("name", hostname).execute()
    if response.data:
        return response.data[0]["id"]
    else:
        insert_response = supabase.table("servers").insert({"name": hostname}).execute()
        return insert_response.data[0]["id"]

def get_folder_size(folder_path: Path) -> float:
    total_size = 0
    for root, _, files in os.walk(folder_path):
        for name in files:
            try:
                fp = Path(root) / name
                total_size += fp.stat().st_size
            except Exception:
                continue
    return total_size / (1024 * 1024 * 1024)  # GB

def collect_file_metadata(directory: str, server_id: int):
    file_records = []
    current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
    for root, dirs, files in os.walk(directory):
        for name in files:
            try:
                file_path = Path(root) / name
                stat = file_path.stat()
                file_extension = file_path.suffix.lower()
                embedding_list = None
                if file_extension in ['.jpg', '.jpeg', '.png']:
                    if stat.st_size < 1024:
                        print(f"⚠️ Skipping small or placeholder file: {file_path}")
                    else:
                        try:
                            embedding_list = get_image_embedding(str(file_path))
                        except UnidentifiedImageError:
                            print(f"⚠️ Skipping corrupted image: {file_path}")
                        except Exception as e:
                            print(f"❌ Failed to get embedding for {file_path}: {e}")
                file_info = {
                    "filename": file_path.name,
                    "path": str(file_path.resolve()),
                    "size_gb": stat.st_size / (1024 * 1024 * 1024),
                    "extension": file_extension,
                    "created": datetime.datetime.fromtimestamp(stat.st_ctime, datetime.timezone.utc).isoformat(),
                    "last_modified": datetime.datetime.fromtimestamp(stat.st_mtime, datetime.timezone.utc).isoformat(),
                    "last_accessed": datetime.datetime.fromtimestamp(stat.st_atime, datetime.timezone.utc).isoformat(),
                    "is_system_file": file_path.name.startswith(".") or (
                        "windows" in platform.system().lower() and file_extension in [".sys", ".dll"]
                    ),
                    "drive": file_path.drive if hasattr(file_path, "drive") else "N/A",
                    "server_id": server_id,
                    "inserted_at": current_time,
                    "last_scan": current_time,
                    "type": "file",
                    "clip_embedding": embedding_list
                }
                file_records.append(file_info)
            except Exception as e:
                print(f"Erreur fichier {name}: {e}")

        for folder in dirs:
            try:
                folder_path = Path(root) / folder
                stat = folder_path.stat()
                folder_info = {
                    "filename": folder_path.name,
                    "path": str(folder_path.resolve()),
                    "size_gb": get_folder_size(folder_path),
                    "extension": None,
                    "created": datetime.datetime.fromtimestamp(stat.st_ctime, datetime.timezone.utc).isoformat(),
                    "last_modified": datetime.datetime.fromtimestamp(stat.st_mtime, datetime.timezone.utc).isoformat(),
                    "last_accessed": datetime.datetime.fromtimestamp(stat.st_atime, datetime.timezone.utc).isoformat(),
                    "is_system_file": folder_path.name.startswith("."),
                    "drive": folder_path.drive if hasattr(folder_path, "drive") else "N/A",
                    "server_id": server_id,
                    "inserted_at": current_time,
                    "last_scan": current_time,
                    "type": "folder",
                    "clip_embedding": None
                }
                file_records.append(folder_info)
            except Exception as e:
                print(f"Erreur dossier {folder}: {e}")
    return file_records

def upsert_to_supabase(records):
    for record in records:
        existing = supabase.table("files").select("path").eq("path", record["path"]).execute()
        if existing.data:
            supabase.table("files").update(record).eq("path", record["path"]).execute()
            print(f"✅ Updated files: {record['filename']}")
        else:
            supabase.table("files").insert(record).execute()
            print(f"➕ Inserted files: {record['filename']}")

        status_record = {
            "path": record["path"],
            "server_id": record["server_id"],
            "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        existing_status = supabase.table("file_status").select("path").eq("path", record["path"]).execute()
        if existing_status.data:
            supabase.table("file_status").update(status_record).eq("path", record["path"]).execute()
            print(f"✅ Updated file_status: {record['filename']}")
        else:
            supabase.table("file_status").insert(status_record).execute()
            print(f"➕ Inserted file_status: {record['filename']}")

if __name__ == "__main__":
    # ➊ Get initial path (from argv or None)
    folder_to_scan = sys.argv[1] if len(sys.argv) > 1 else None

    # ➋ Loop until valid
    while True:
        if not folder_to_scan:
            folder_to_scan = input("Please enter the full folder path to scan: ").strip()
        if os.path.isdir(folder_to_scan):
            break
        print(f"❌ Error: '{folder_to_scan}' is not a valid directory.")
        folder_to_scan = None  # force re-prompt

    print(f"Scanning folder: {folder_to_scan}")
    server_id = get_server_id_from_hostname()
    collected = collect_file_metadata(folder_to_scan, server_id)
    upsert_to_supabase(collected)

    print("\n✅ Scan completed. Data added to database.")
