#!/usr/bin/env python3

import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
QUESTION_PATH = ROOT / "data" / "normalized-question-bank.json"
OVERRIDES_PATH = ROOT / "data" / "question_taxonomy_overrides.json"
BATCH_DIR = ROOT / "data" / "recategorization_batches"
BATCH_COUNT = 10


def main():
    questions = json.loads(QUESTION_PATH.read_text())
    overrides = json.loads(OVERRIDES_PATH.read_text())
    sections = overrides["sections"]

    BATCH_DIR.mkdir(parents=True, exist_ok=True)
    for old_file in BATCH_DIR.glob("batch-*.json"):
        old_file.unlink()

    chunk_size = math.ceil(len(questions) / BATCH_COUNT)
    ids_seen = set()

    for batch_index in range(BATCH_COUNT):
        start = batch_index * chunk_size
        end = min(start + chunk_size, len(questions))
        batch_questions = questions[start:end]
        records = []
        for question in batch_questions:
            question_id = question["id"]
            if question_id in ids_seen:
                raise ValueError(f"Duplicate question id encountered while batching: {question_id}")
            ids_seen.add(question_id)
            records.append(
                {
                    "questionId": question_id,
                    "sourceTopic": question.get("sourceTopic"),
                    "sourceSubtopic": question.get("sourceSubtopic"),
                    "currentSectionId": question.get("sectionId"),
                    "currentOfficialSubtopic": question.get("officialSubtopic"),
                    "type": question.get("type"),
                    "stem": question.get("stem"),
                    "choices": question.get("choices", {}),
                }
            )

        payload = {
            "schemaVersion": 1,
            "batchNumber": batch_index + 1,
            "batchCount": BATCH_COUNT,
            "questionCount": len(records),
            "allowedSections": sections,
            "questions": records,
        }
        output_path = BATCH_DIR / f"batch-{batch_index + 1:02d}.json"
        output_path.write_text(json.dumps(payload, indent=2))

    if len(ids_seen) != len(questions):
        raise ValueError(f"Expected {len(questions)} unique questions, got {len(ids_seen)}")

    print(f"Wrote {BATCH_COUNT} batches to {BATCH_DIR}")
    print(f"Total questions batched: {len(ids_seen)}")


if __name__ == "__main__":
    main()
