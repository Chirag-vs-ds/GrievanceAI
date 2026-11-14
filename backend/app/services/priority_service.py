
def recommend_priority(complaint, category):

    text = complaint.lower()

    high_keywords = [
        "unable to access",
        "completely blocked",
        "repeatedly failing",
        "urgent",
        "multiple attempts failed"
    ]

    low_categories = [
        "General Query"
    ]

    if any(keyword in text for keyword in high_keywords):
        return "High"

    if category in low_categories:
        return "Low"

    return "Medium"
