
import pandas as pd
import random
from pathlib import Path

# Make dataset generation reproducible
random.seed(42)

# --------------------------------------------------
# 1. Define complaint categories and sample complaints
# --------------------------------------------------

grievance_data = {

    "Aadhaar Update": {
        "department": "Enrolment & Update Division",
        "complaints": [
            ("I am unable to update my registered mobile number.", "Medium"),
            ("My address update request is still pending.", "Medium"),
            ("I submitted an update request but it was rejected.", "Medium"),
            ("I cannot change my date of birth in my records.", "Medium"),
            ("My mobile number update is not getting processed.", "Medium"),
            ("I have been waiting for my address correction.", "Low"),
            ("The update centre is unable to process my request.", "Medium"),
            ("I want to update my registered email address.", "Low"),
            ("My demographic update request is taking too long.", "Medium"),
            ("I received an error while submitting an update request.", "Medium")
        ]
    },

    "Authentication": {
        "department": "Authentication and Verification Division",
        "complaints": [
            ("My Aadhaar authentication request keeps failing.", "High"),
            ("I am unable to complete biometric authentication.", "High"),
            ("The authentication system is repeatedly rejecting my request.", "High"),
            ("My identity verification is not working.", "Medium"),
            ("I am facing repeated authentication failures.", "High"),
            ("The OTP authentication process is not completing.", "Medium"),
            ("My authentication request shows an error.", "Medium"),
            ("I cannot verify my identity through the system.", "Medium"),
            ("The verification process fails every time.", "High"),
            ("Authentication is unavailable when I try to use the service.", "Medium")
        ]
    },

    "Enrolment": {
        "department": "Enrolment & Update Division",
        "complaints": [
            ("I am unable to book an Aadhaar enrolment appointment.", "Medium"),
            ("The enrolment centre is not accepting my application.", "Medium"),
            ("My new enrolment request has not been processed.", "Medium"),
            ("I cannot find an available enrolment appointment.", "Low"),
            ("My enrolment application is still pending.", "Medium"),
            ("The enrolment process stopped unexpectedly.", "Medium"),
            ("I need help with my new Aadhaar enrolment.", "Low"),
            ("My enrolment appointment was cancelled.", "Medium"),
            ("I am facing difficulties during the enrolment process.", "Medium"),
            ("The enrolment centre could not complete my request.", "Medium")
        ]
    },

    "Technical Issue": {
        "department": "Technology Management Division",
        "complaints": [
            ("The website is not loading properly.", "Medium"),
            ("The portal displays an internal server error.", "High"),
            ("I cannot access the online service.", "Medium"),
            ("The application crashes whenever I open it.", "High"),
            ("The website keeps showing a technical error.", "Medium"),
            ("The online portal is responding very slowly.", "Low"),
            ("I am unable to submit the online form because of an error.", "Medium"),
            ("The service page is not opening.", "Medium"),
            ("The website stopped working during my request.", "High"),
            ("I am experiencing repeated technical problems on the portal.", "Medium")
        ]
    },

    "Data Correction": {
        "department": "Enrolment & Update Division",
        "complaints": [
            ("My name is incorrectly displayed in my records.", "Medium"),
            ("My date of birth is showing incorrect information.", "Medium"),
            ("There is a spelling mistake in my name.", "Low"),
            ("My gender information is displayed incorrectly.", "Medium"),
            ("My demographic information contains an error.", "Medium"),
            ("The address displayed in my record is incorrect.", "Medium"),
            ("My personal details are showing incorrect information.", "Medium"),
            ("I noticed an error in my recorded date of birth.", "Medium"),
            ("My demographic details do not match my submitted information.", "Medium"),
            ("I need assistance correcting an incorrect name entry.", "Low")
        ]
    },

    "General Query": {
        "department": "Customer Relationship Management & Logistics and Channel Interface Division",
        "complaints": [
            ("How can I download my Aadhaar document?", "Low"),
            ("Where can I find my nearest enrolment centre?", "Low"),
            ("I want to know how to check my update status.", "Low"),
            ("What documents are required for an address update?", "Low"),
            ("How can I retrieve my Aadhaar number?", "Low"),
            ("I need information about the Aadhaar update process.", "Low"),
            ("Where can I get assistance regarding Aadhaar services?", "Low"),
            ("How do I check my enrolment application status?", "Low"),
            ("I want to understand the authentication process.", "Low"),
            ("Please provide information about Aadhaar services.", "Low")
        ]
    }
}


# --------------------------------------------------
# 2. Add variations to complaint text
# --------------------------------------------------

openings = [
    "",
    "Hello, ",
    "I need assistance. ",
    "Please help me. ",
    "I am facing an issue. ",
    "I would like to report that ",
    "I am experiencing a problem because ",
    "I need support because "
]

endings = [
    "",
    " Please look into this issue.",
    " Kindly help me resolve it.",
    " I need assistance with this problem.",
    " Please provide a solution.",
    " Kindly check this request."
]


# --------------------------------------------------
# 3. Generate synthetic records
# --------------------------------------------------

records = []

grievance_number = 1

for category, details in grievance_data.items():

    department = details["department"]
    complaints = details["complaints"]

    for i in range(100):

        # Select a base complaint
        complaint, priority = random.choice(complaints)

        # Add wording variations
        opening = random.choice(openings)
        ending = random.choice(endings)

        complaint_text = opening + complaint + ending

        # Generate synthetic grievance record
        record = {
            "grievance_id": f"GRV-{grievance_number:04d}",
            "complaint_text": complaint_text,
            "category": category,
            "priority": priority,
            "department": department,
            "status": random.choice([
                "Pending",
                "In Progress",
                "Resolved"
            ])
        }

        records.append(record)

        grievance_number += 1


# --------------------------------------------------
# 4. Create DataFrame and shuffle records
# --------------------------------------------------

df = pd.DataFrame(records)

df = df.sample(frac=1, random_state=42).reset_index(drop=True)


# --------------------------------------------------
# 5. Save dataset as CSV
# --------------------------------------------------

output_path = Path(__file__).resolve().parent.parent / "dataset"

output_path.mkdir(parents=True, exist_ok=True)

csv_path = output_path / "synthetic_grievances.csv"

df.to_csv(csv_path, index=False, encoding="utf-8")


# --------------------------------------------------
# 6. Display dataset information
# --------------------------------------------------

print("Synthetic grievance dataset created successfully!")

print("\nDataset shape:", df.shape)

print("\nCategory distribution:")
print(df["category"].value_counts())

print("\nFirst five records:")
print(df.head())

print("\nCSV saved at:")
print(csv_path)
