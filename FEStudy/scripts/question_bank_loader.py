#!/usr/bin/env python3

import json
import re
from pathlib import Path


QUESTIONS_DIR_NAME = "questions"
COMBINED_FILENAME = "fe_exam_questions.json"


def slugify(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def with_question_ids(topic_name, subtopic_name, questions, file_stem):
    normalized = []
    topic_slug = slugify(topic_name or "topic")
    subtopic_slug = slugify(subtopic_name or "general")
    for index, question in enumerate(questions, start=1):
        next_question = dict(question)
        if not next_question.get("id"):
            next_question["id"] = f"{file_stem}:{topic_slug}:{subtopic_slug}:{index:04d}"
        normalized.append(next_question)
    return normalized


def load_question_bank(root):
    questions_dir = Path(root) / QUESTIONS_DIR_NAME
    source_path = Path(root) / COMBINED_FILENAME
    if questions_dir.exists():
        topics = []
        for path in sorted(questions_dir.glob("*.json")):
            payload = json.loads(path.read_text())
            for topic in payload.get("topics", []):
                topic_name = topic.get("topic", "Unknown")
                subtopic_name = topic.get("subtopic") or topic_name
                topics.append(
                    {
                        "topic": topic_name,
                        "subtopic": subtopic_name,
                        "questions": with_question_ids(
                            topic_name,
                            subtopic_name,
                            topic.get("questions", []),
                            path.stem,
                        ),
                    }
                )
        combined = {"topics": topics}
        source_path.write_text(json.dumps(combined, indent=2))
        return combined
    return json.loads(source_path.read_text())
