#!/usr/bin/env python3
"""Extract text from a PDF using pymupdf. Safe from shell injection."""
import sys
import fitz

if len(sys.argv) != 3:
    print("Usage: extract-pdf.py <input.pdf> <output.txt>", file=sys.stderr)
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

doc = fitz.open(input_path)
text = []
for page in doc:
    text.append(f"--- Page {page.number + 1} ---")
    text.append(page.get_text())

with open(output_path, "w") as f:
    f.write("\n".join(text))

print(f"Extracted {len(doc)} pages")
