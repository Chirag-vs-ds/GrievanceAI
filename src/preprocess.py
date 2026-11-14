
import pandas as pd
import re
from pathlib import Path

# Project directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Dataset paths
input_path = BASE_DIR / "dataset" / "cleaned_grievances.csv"
output_path = BASE_DIR / "dataset" / "preprocessed_grievances.csv"

# Load cleaned dataset
df = pd.read_csv(input_path)

# Text preprocessing function
def preprocess_text(text):

    # Convert text to lowercase
    text = text.lower()

    # Remove special characters and punctuation
    text = re.sub(r"[^a-z0-9\s]", "", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()

    return text


# Apply preprocessing
df["cleaned_text"] = df["complaint_text"].apply(preprocess_text)

# Save processed dataset
df.to_csv(output_path, index=False)

print("Text preprocessing completed!")

print("\nOriginal complaint:")
print(df["complaint_text"].iloc[0])

print("\nPreprocessed complaint:")
print(df["cleaned_text"].iloc[0])

print("\nDataset shape:", df.shape)
print("\nSaved to:", output_path)
