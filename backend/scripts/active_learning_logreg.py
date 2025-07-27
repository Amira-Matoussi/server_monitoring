import pandas as pd
import numpy as np
import pickle
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.metrics import classification_report

# === Config ===
LABELED_PATH = 'event_logs_rows.xlsx'
UNLABELED_PATH = 'unlabeled_logs.xlsx'
VECTORIZER_PATH = 'tfidf_vectorizer.pkl'
MODEL_PATH = 'logreg_model.pkl'
K = 10  # Number of samples to label per round
CV_FOLDS = 5  # Number of folds for cross-validation

# === Step 1: Load and preprocess labeled data ===
def load_labeled_data():
    df = pd.read_excel(LABELED_PATH).dropna(subset=['Description', 'Label'])
    df['Label'] = df['Label'].astype(int)
    return df

def preprocess(df):
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    X = vectorizer.fit_transform(df['Description'])
    y = df['Label']
    return vectorizer, X, y

# === New: Cross-Validation Evaluation ===
def evaluate_cv(model, X, y, k=CV_FOLDS):
    """Run stratified k-fold CV and print mean±std for key metrics."""
    skf = StratifiedKFold(n_splits=k, shuffle=True, random_state=42)
    scoring = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
    cv_results = cross_validate(model, X, y, cv=skf, scoring=scoring, n_jobs=-1)
    print("\n=== Cross-Validation ({0}-fold) ===".format(k))
    for metric in scoring:
        scores = cv_results[f'test_{metric}']
        print(f"{metric:>8}: {scores.mean():.3f} ± {scores.std():.3f}")

# === Step 2: Train or retrain model ===
def train_model(X, y):
    model = LogisticRegression(max_iter=1000, class_weight='balanced')
    model.fit(X, y)
    return model

# === Step 3: Uncertainty sampling ===
def select_uncertain_samples(model, vectorizer, k):
    unlabeled_df = pd.read_excel(UNLABELED_PATH).dropna(subset=['Description'])
    X_unlabeled = vectorizer.transform(unlabeled_df['Description'])
    probs = model.predict_proba(X_unlabeled)
    uncertainty = 1 - np.max(probs, axis=1)
    top_k_indices = np.argsort(uncertainty)[-k:]
    return unlabeled_df.iloc[top_k_indices].reset_index(drop=True)

# === Step 4: Manual labeling ===
def label_samples(samples):
    print("\n=== Samples to Label ===")
    for i, desc in enumerate(samples['Description']):
        print(f"{i}. {desc}")
    labels = []
    for i in range(len(samples)):
        label = input(f"Label for sample {i} (1 = Threat, 0 = Non-Threat): ")
        labels.append(int(label.strip()))
    samples['Label'] = labels
    return samples

# === Step 5: Update labeled dataset ===
def update_labeled_data(new_samples):
    df = pd.read_excel(LABELED_PATH)
    df = pd.concat([df, new_samples], ignore_index=True)
    df.to_excel(LABELED_PATH, index=False)
    print("Labeled dataset updated.")

# === Main Active Learning Loop ===
def active_learning_round():
    df = load_labeled_data()
    vectorizer, X, y = preprocess(df)

    # --- Evaluate current model with cross-validation ---
    model_cv = LogisticRegression(max_iter=1000, class_weight='balanced')
    evaluate_cv(model_cv, X, y)

    # Save vectorizer
    with open(VECTORIZER_PATH, 'wb') as f:
        pickle.dump(vectorizer, f)

    # Train on all labeled data
    model = train_model(X, y)

    # Save model
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)

    # Evaluate on a held-out split for quick feedback
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model.fit(X_train, y_train)
    print("\n=== Evaluation (Train/Validation Split) ===")
    print(classification_report(y_val, model.predict(X_val)))

    # Select new samples to label
    to_label = select_uncertain_samples(model, vectorizer, K)
    labeled = label_samples(to_label)

    # Update dataset and retrain in next round
    update_labeled_data(labeled)

# === Run loop ===
if __name__ == '__main__':
    active_learning_round()
