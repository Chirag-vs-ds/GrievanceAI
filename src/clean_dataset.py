"""
Alias / entry point for cleaned_data.py
"""
import runpy
from pathlib import Path

target = Path(__file__).parent / "cleaned_data.py"
runpy.run_path(str(target), run_name="__main__")
