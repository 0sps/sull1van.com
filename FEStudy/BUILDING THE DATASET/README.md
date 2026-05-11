# Journey2PE Scraper Setup

This folder contains the standalone scrapers used to rebuild the FE question dataset from `journey2pe.com`.

## One-time setup

```bash
cd "/Users/sps/Documents/GitHub/sull1van.com/FEStudy/BUILDING THE DATASET"
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Run a single section

`scraper2.py` is the newer section-aware scraper.

```bash
source .venv/bin/activate
python scraper2.py 2
```

That writes JSON files into:

`/Users/sps/Documents/GitHub/sull1van.com/FEStudy/BUILDING THE DATASET/outputs`

## Run all sections

```bash
source .venv/bin/activate
python scraper2.py
```

## Optional custom output directory

```bash
SCRAPER_OUTPUT_DIR="/tmp/journey2pe-output" python scraper2.py 2
```

## Notes

- Inline SVG diagrams are preserved in the extracted question text.
- Relative asset URLs inside SVG are normalized to absolute `https://journey2pe.com/...` URLs.
- MathJax `<script type="math/tex">` blocks are preserved instead of being dropped.
