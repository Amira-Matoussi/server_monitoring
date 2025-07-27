import requests
import joblib
import os

# Supabase config
SUPABASE_URL = "https://somtnihlenbxohqrmfbe.supabase.co/rest/v1/event_logs"
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbXRuaWhsZW5ieG9ocXJtZmJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI5MDM0OSwiZXhwIjoyMDYxODY2MzQ5fQ.9YIOqt0WkYNNsJdZP6Mfn-IlATFVfghzHubANqjG7Eg"

HEADERS = {
    "apikey": SUPABASE_API_KEY,
    "Authorization": f"Bearer {SUPABASE_API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

# ✅ Absolute paths to model and vectorizer
MODEL_PATH = r"C:\Users\mira\Downloads\version6\backend\scripts\logreg_model.pkl"
VECTORIZER_PATH = r"C:\Users\mira\Downloads\version6\backend\scripts\tfidf_vectorizer.pkl"

def load_model_and_vectorizer(model_path, vectorizer_path):
    """Loads the trained model and vectorizer from disk."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    if not os.path.exists(vectorizer_path):
        raise FileNotFoundError(f"Vectorizer file not found at {vectorizer_path}")

    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    print("✅ Model and vectorizer loaded successfully.")
    return model, vectorizer

def fetch_unclassified_events(limit=100):
    """Fetches events from Supabase where is_threat is 0."""
    query = f"?is_threat=eq.0&limit={limit}"
    print(f"📥 Fetching events from: {SUPABASE_URL + query}")
    try:
        response = requests.get(SUPABASE_URL + query, headers=HEADERS, timeout=30)
        response.raise_for_status()
        print(f"✅ Successfully fetched {len(response.json())} events.")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching events: {e}")
        return []

def update_event(event_id, is_threat):
    """Updates the is_threat status for a specific event in Supabase."""
    update_url = f"{SUPABASE_URL}?Id=eq.{event_id}"
    payload = {"is_threat": is_threat}
    print(f"🔄 Updating event Id {event_id} to is_threat={is_threat} at {update_url}")
    try:
        response = requests.patch(update_url, json=payload, headers=HEADERS, timeout=30)
        response.raise_for_status()
        print(f"✅ Successfully updated event Id {event_id}.")
    except requests.exceptions.RequestException as e:
        print(f"❌ Error updating event Id {event_id}: {e}")

def classify_event(message, vectorizer, model):
    """Classifies a message using the loaded TF-IDF vectorizer and Logistic Regression model."""
    if not message or not isinstance(message, str) or message.strip() == "":
        print("⚠️ Message is empty or invalid, classifying as BENIGN (0).")
        return 0

    try:
        message_vector = vectorizer.transform([message])
        prediction = model.predict(message_vector)
        result = int(prediction[0])
        label = "THREAT" if result == 1 else "BENIGN"
        print(f"🔍 Message classified as {label} ({result}).")
        return result
    except Exception as e:
        print(f"❌ Error during classification: {e}. Defaulting to BENIGN (0).")
        return 0

def main():
    """Main function to fetch, classify, and update events."""
    print("🚀 Starting event classification process...")

    try:
        model, vectorizer = load_model_and_vectorizer(MODEL_PATH, VECTORIZER_PATH)
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print("📌 Please ensure the model and vectorizer files are present at the specified path.")
        return
    except Exception as e:
        print(f"❌ Unexpected error loading model/vectorizer: {e}")
        return

    events = fetch_unclassified_events(limit=10000)

    if not events:
        print("📭 No unclassified events found or error fetching events. Exiting.")
        return

    print(f"🛠 Processing {len(events)} events...")
    processed_count = 0

    for event in events:
        event_id = event.get("Id")
        message = event.get("Message")

        if event_id is None:
            print("⚠️ Skipping event with missing 'Id'.")
            continue

        is_threat = classify_event(message, vectorizer, model)
        update_event(event_id, is_threat)
        processed_count += 1

    print(f"✅ Finished. {processed_count} events classified and updated.")

if __name__ == "__main__":
    main()
# This script is designed to classify events as threats or benign based on their messages.
# It fetches unclassified events from Supabase, classifies them using a pre-trained model,  