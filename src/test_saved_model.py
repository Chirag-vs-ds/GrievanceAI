
import re
import joblib

from pathlib import Path
from department_router import route_grievance


# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "grievance_classifier.joblib"


# Same preprocessing used during training
def preprocess_text(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def predict_grievance(model, complaint):

    if not complaint.strip():
        raise ValueError("Complaint cannot be empty.")

    cleaned_text = preprocess_text(complaint)

    # Predicted category
    prediction = model.predict([cleaned_text])[0]

    # Logistic Regression probability estimates
    probabilities = model.predict_proba([cleaned_text])[0]

    # Sort categories by probability
    results = sorted(
        zip(model.classes_, probabilities),
        key=lambda item: item[1],
        reverse=True
    )

    print("\nComplaint:", complaint)
    print("Predicted Category:", prediction)

    print("\nTop 3 category scores:")

    for category, score in results[:3]:
        print(f"{category}: {score * 100:.2f}%")

    # These are model scores, not calibrated confidence.
    top_score = float(results[0][1])
        # Department recommendation
    department = route_grievance(prediction)

    # Calculate margin between top two predictions
    second_score = float(results[1][1])
    margin = top_score - second_score

    print("\nSuggested Department:", department)
    print(f"Top prediction score: {top_score * 100:.2f}%")
    print(f"Prediction margin: {margin * 100:.2f}%")

    # Provisional manual review rules
    if top_score < 0.50 or margin < 0.10:
        print("Status: Manual Review Required")
    else:
        print("Status: Ready for Human Review")




def main():

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Saved model not found: {MODEL_PATH}"
        )

    print("Loading saved GrievanceAI model...")

    model = joblib.load(MODEL_PATH)

    print("Model loaded successfully!")

    test_complaints = [
        "I want to update my Aadhaar address.",
        "My OTP is not arriving during authentication.",
        "My date of birth is incorrect in Aadhaar.",
        "I want to enroll for Aadhaar for the first time.",
        "The UIDAI website keeps crashing.",
        "What documents are required for an address update?"
    ]

    print("\n========== SAVED MODEL TESTING ==========")

    for complaint in test_complaints:
        predict_grievance(model, complaint)


if __name__ == "__main__":
    main()
