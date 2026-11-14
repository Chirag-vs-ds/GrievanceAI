
import re
import joblib

from pathlib import Path

# Project root directory
BASE_DIR = Path(__file__).resolve().parents[3]

MODEL_PATH = BASE_DIR / "models" / "grievance_classifier.joblib"

# Department mapping
DEPARTMENT_MAPPING = {
    "Aadhaar Update": "Enrolment & Update Division",
    "Authentication": "Authentication and Verification Division",
    "Data Correction": "Enrolment & Update Division",
    "Enrolment": "Enrolment & Update Division",
    "General Query": "Customer Relationship Management Division",
    "Technical Issue": "Technology Management Division"
}


def preprocess_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# Load model once when this module is imported
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"ML model not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)


def predict_grievance(complaint):

    if not complaint or not complaint.strip():
        raise ValueError("Complaint cannot be empty.")

    cleaned_text = preprocess_text(complaint)

    prediction = model.predict([cleaned_text])[0]

    probabilities = model.predict_proba([cleaned_text])[0]

    results = sorted(
        zip(model.classes_, probabilities),
        key=lambda item: item[1],
        reverse=True
    )

    top_score = float(results[0][1])
    second_score = float(results[1][1])
    margin = top_score - second_score

    department = DEPARTMENT_MAPPING[prediction]

    manual_review = (
        top_score < 0.50 or margin < 0.10
    )

    return {
        "complaint": complaint,
        "predicted_category": prediction,
        "suggested_department": department,
        "top_prediction_score": round(top_score * 100, 2),
        "prediction_margin": round(margin * 100, 2),
        "manual_review_required": manual_review,
        "top_predictions": [
            {
                "category": str(category),
                "score": round(float(score) * 100, 2)
            }
            for category, score in results[:3]
        ]
    }
