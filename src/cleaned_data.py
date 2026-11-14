import pandas as pd
from pathlib import Path

# Load original dataset
BASE_DIR = Path(__file__).resolve().parent.parent

input_path = BASE_DIR / "dataset" / "synthetic_grievances.csv"
output_path = BASE_DIR / "dataset" / "cleaned_grievances.csv"

df = pd.read_csv(input_path)

print("Original dataset shape:", df.shape)

# Remove exact duplicate complaint texts
df_cleaned = df.drop_duplicates(
    subset=["complaint_text"],
    keep="first"
).copy()

# Reset index
df_cleaned.reset_index(drop=True, inplace=True)

# Save cleaned dataset
df_cleaned.to_csv(output_path, index=False)

print("\nCleaning completed!")
print("Cleaned dataset shape:", df_cleaned.shape)
print("Removed records:", len(df) - len(df_cleaned))

print("\nCategory distribution:")
print(df_cleaned["category"].value_counts())

print("\nSaved to:", output_path)