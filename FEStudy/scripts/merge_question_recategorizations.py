#!/usr/bin/env python3

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
QUESTION_PATH = ROOT / "data" / "normalized-question-bank.json"
OVERRIDES_PATH = ROOT / "data" / "question_taxonomy_overrides.json"
RESULTS_DIR = ROOT / "data" / "recategorization_results"


def main():
    questions = json.loads(QUESTION_PATH.read_text())
    overrides = json.loads(OVERRIDES_PATH.read_text())
    valid_sections = {section["id"]: set(section["subtopics"]) for section in overrides["sections"]}
    expected_ids = {question["id"] for question in questions}

    assignments = {}
    missing_result_files = []

    for batch_number in range(1, 11):
        result_path = RESULTS_DIR / f"batch-{batch_number:02d}-results.json"
        if not result_path.exists():
            missing_result_files.append(result_path.name)
            continue
        records = json.loads(result_path.read_text())
        if not isinstance(records, list):
            raise ValueError(f"{result_path.name} must contain a JSON list")
        for record in records:
            question_id = record.get("questionId")
            section_id = record.get("sectionId")
            official_subtopic = record.get("officialSubtopic")

            if question_id not in expected_ids:
                raise ValueError(f"{result_path.name}: unknown question id {question_id}")
            if question_id in assignments:
                raise ValueError(f"Duplicate classification for question id {question_id}")
            if section_id not in valid_sections:
                raise ValueError(f"{result_path.name}: invalid section id {section_id}")
            if official_subtopic not in valid_sections[section_id]:
                raise ValueError(
                    f"{result_path.name}: invalid subtopic '{official_subtopic}' for section '{section_id}'"
                )

            assignments[question_id] = {
                "questionId": question_id,
                "sectionId": section_id,
                "officialSubtopic": official_subtopic,
            }

    if missing_result_files:
        raise ValueError("Missing result files: " + ", ".join(missing_result_files))

    missing_ids = sorted(expected_ids - assignments.keys())
    if missing_ids:
        raise ValueError(f"Missing classifications for {len(missing_ids)} questions")

    merged_assignments = [assignments[question["id"]] for question in questions]
    overrides["assignments"] = merged_assignments
    OVERRIDES_PATH.write_text(json.dumps(overrides, indent=2))

    print(f"Wrote {len(merged_assignments)} assignments to {OVERRIDES_PATH}")


if __name__ == "__main__":
    main()
