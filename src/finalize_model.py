
import pandas as pd
import re
import joblib

from pathlib import Path

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent

ORIGINAL_PATH = BASE_DIR / "dataset" / "preprocessed_grievances.csv"
ADDITIONAL_PATH = BASE_DIR / "dataset" / "additional_training.csv"
MODEL_PATH = BASE_DIR / "models" / "grievance_classifier.joblib"


# Text preprocessing
def preprocess_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def main():

    print("Loading training datasets...")

    original = pd.read_csv(ORIGINAL_PATH)
    additional = pd.read_csv(ADDITIONAL_PATH)

    # Combine Model B training data
    original_data = original[["complaint_text", "category"]].copy()
    additional_data = additional[["complaint_text", "category"]].copy()

    combined = pd.concat(
        [original_data, additional_data],
        ignore_index=True
    )

    # Clean complaint text
    combined["cleaned_text"] = (
        combined["complaint_text"].apply(preprocess_text)
    )

    # Check for conflicting category labels
    conflicts = combined.groupby("cleaned_text")["category"].nunique()
    conflicts = conflicts[conflicts > 1]

    if not conflicts.empty:
        print("\nConflicting complaint labels found:")
        print(conflicts)
        raise ValueError(
            "Resolve conflicting labels before training the final model."
        )

    # Remove duplicate complaints with the same label
    before = len(combined)

    combined.drop_duplicates(
        subset=["cleaned_text"],
        inplace=True
    )

    combined = combined.reset_index(drop=True)

    print("\nTraining dataset summary")
    print("------------------------")
    print("Records before deduplication:", before)
    print("Records after deduplication:", len(combined))
    print("\nCategory distribution:")
    print(combined["category"].value_counts())

    # Create Model B pipeline
    model = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2)
            )
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000,
                random_state=42,
                class_weight="balanced"
            )
        )
    ])

    print("\nTraining Model B...")

    model.fit(
        combined["cleaned_text"],
        combined["category"]
    )

    # Save trained pipeline
    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    joblib.dump(model, MODEL_PATH)

    print("\nModel training completed!")
    print("Model saved at:", MODEL_PATH)

    print("\nClasses learned by the model:")
    print(model.classes_)


if __name__ == "__main__":
    main()
