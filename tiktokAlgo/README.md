# TikTok Algo: batch photo proof of concept

A standalone browser tool using the public face models downloaded from https://ayoships.com/tools/tiktok-face on November 5, 2026.

## Usage

Open `/tiktokAlgo/` on the built site. Choose or drop multiple photos, then click **Run batch**. **Try a sample batch** creates two sample variations and runs them automatically.

- Up to 100 photos per batch, 25 MB per file.
- Runs sequentially in the browser with progress and pause/resume.
- Scores the largest detected face by default. Enable **Analyze every detected face** before running to score up to six detected faces per photo.
- Sort by score, filename, or upload order, and export results to CSV.
- Estimated ages below 16 receive no score, including in CSV exports.
- Photos and results remain in tab memory. Reloading clears the batch.

## Local development

No dependencies to install. From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8000/tiktokAlgo/ . Use an HTTP server rather than opening the HTML file directly. The page also works in the existing Jekyll build with no configuration changes.

## Implementation and limitations

`index.html`, `batch.css`, and `batch.js` implement the interface. `assets/face.js` and `assets/engine.js` contain the original inference logic. `assets/runtime/` contains the downloaded MediaPipe runtime (renamed from vendor to avoid Jekyll exclusions). All models, fonts, and sample images load from relative paths. The batch page has no analytics or upload endpoint.

Inference runs on the main thread, so larger batches can briefly affect responsiveness. Pause takes effect after the current photo. Detection uses the original whole-image, padded, and rotated passes; it does not run the original slower search for additional small faces. Browser-supported JPEG, PNG, and WebP are recommended; unsupported formats show a per-photo error and the queue continues.

Scores and estimated attributes are experimental model outputs. The original source's ownership and licensing remain with its authors; review permissions before redistribution.

## Verification

JavaScript syntax and local asset references were checked. Full batch inference and CSV download still need an end-to-end browser check.
