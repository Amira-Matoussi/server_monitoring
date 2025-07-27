import os
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client
import datetime
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import re

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env.local")
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in .env.local")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def calculate_deletion_score(filepath: str, filename: str, last_accessed_iso: str) -> float:
    """
    Calculates a normalized deletion score (0-100) based on conditions:
    - .exe in system folders (-40)
    - .exe in Downloads/Temp/Users (+30)
    - .exe not accessed in 180+ days (+10)
    - filename matches obfuscation pattern (+20)
    - filename contains "setup" or "install" (+10)
    """
    score = 0
    fname_lower = filename.lower()
    filepath_lower = filepath.lower()

    # Parse last accessed date/time
    try:
        last_accessed_dt = datetime.datetime.fromisoformat(last_accessed_iso.rstrip('Z'))
        if last_accessed_dt.tzinfo is None:
            last_accessed_dt = last_accessed_dt.replace(tzinfo=datetime.timezone.utc)
    except Exception:
        last_accessed_dt = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3650)

    # Scoring rules
    system_paths = [r"c:\\program files", r"c:\\windows\\system32", r"c:\\windows"]
    if fname_lower.endswith(".exe") and any(sp in filepath_lower for sp in system_paths):
        score -= 40

    user_paths = ["downloads", "temp", "users"]
    if fname_lower.endswith(".exe") and any(up in filepath_lower for up in user_paths):
        score += 30

    days_since_access = (datetime.datetime.now(datetime.timezone.utc) - last_accessed_dt).days
    if fname_lower.endswith(".exe") and days_since_access > 180:
        score += 20

    if re.match(r"^[a-z]{5}\d{2}\.exe$", fname_lower):
        score += 20

    if "setup" in fname_lower or "install" in fname_lower:
        score += 10

    # Normalize between 0 and 100
    min_score, max_score = -40, 70
    normalized = (score - min_score) / (max_score - min_score) * 100
    return max(0.0, min(100.0, normalized))


def fetch_files():
    response = supabase.table("files") \
                       .select("path, filename, last_scan, clip_embedding, server_id") \
                       .execute()
    return response.data or []


def calculate_duplicates(files_data):
    """
    Build similarity matrix and collect duplicates per file path.
    """
    paths, embeddings = [], []
    for f in files_data:
        emb = f.get("clip_embedding")
        if emb:
            paths.append(f["path"])
            embeddings.append(np.array(emb))

    duplicates = {p: [] for p in paths}
    if len(embeddings) < 2:
        return duplicates

    sim_matrix = cosine_similarity(embeddings)
    for i, p in enumerate(paths):
        for j, score in enumerate(sim_matrix[i]):
            if i != j and score > 0.9:
                duplicates[p].append({"path": paths[j], "similarity": float(score)})
    return duplicates


def update_file_status(files_data, duplicates_dict):
    for f in files_data:
        path = f["path"]
        filename = f.get("filename", os.path.basename(path))
        last_scan = f.get("last_scan")

        # 1) compute your original deletion score
        deletion_score = calculate_deletion_score(path, filename, last_scan)
        # 2) compute your duplicate score (as a fraction 0–1)
        dup_score = max((d["similarity"] for d in duplicates_dict.get(path, [])), default=0.0)

        # --- NEW: bump deletion_score up to the duplicate threshold ---
        # convert to a 0–100 scale
        dup_percent = dup_score * 100
        # check in descending 10‐point steps
        for threshold in range(90, 0, -10):
            if dup_percent > threshold:
                # only raise it if it’s currently lower
                deletion_score = max(deletion_score, float(threshold))
                break
        # -----------------------------------------------------------------

        record = {
            "deletion_score": deletion_score,
            "duplicate_score": dup_percent,   # store as percent if you like
            "duplicates": duplicates_dict.get(path, []),
            "last_updated": datetime.datetime.now(
                datetime.timezone.utc
            ).isoformat(),
        }

        existing = (
            supabase.table("file_status")
            .select("path")
            .eq("path", path)
            .execute()
        )
        if existing.data:
            supabase.table("file_status").update(record).eq("path", path).execute()
            print(f"✅ Updated file_status for {path}")
        else:
            record["path"] = path
            record["server_id"] = f.get("server_id")
            supabase.table("file_status").insert(record).execute()
            print(f"➕ Inserted file_status for {path}")



def main():
    files = fetch_files()
    duplicates = calculate_duplicates(files)
    update_file_status(files, duplicates)


if __name__ == "__main__":
    main()
