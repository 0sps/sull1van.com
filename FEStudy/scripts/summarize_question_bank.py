#!/usr/bin/env python3

import json
from collections import Counter
from pathlib import Path
from question_bank_loader import load_question_bank


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "data" / "question_bank_summary.json"


def iter_subtopics(topic):
    nested_subtopics = topic.get("subtopics")
    if isinstance(nested_subtopics, list) and nested_subtopics:
        return nested_subtopics
    direct_questions = topic.get("questions", [])
    if direct_questions:
        return [{"subtopic": topic.get("subtopic") or topic.get("topic") or "General", "questions": direct_questions}]
    return []


def main() -> None:
    payload = load_question_bank(ROOT)
    topics = payload.get("topics", [])

    unique_tags = set()
    source_topics = []
    question_type_counts = Counter()
    total_questions = 0

    for topic in topics:
      subtopic_entries = []
      topic_question_count = 0
      for subtopic in iter_subtopics(topic):
        questions = subtopic.get("questions", [])
        mc_count = 0
        fr_count = 0
        for question in questions:
          total_questions += 1
          question_type = "mcq" if len(question.get("choices", {})) >= 2 and question.get("answer") in {"A", "B", "C", "D"} else "open"
          question_type_counts[question_type] += 1
          if question_type == "mcq":
            mc_count += 1
          else:
            fr_count += 1
          unique_tags.update(question.get("tags", []))

        topic_question_count += len(questions)
        subtopic_entries.append(
          {
            "name": subtopic.get("subtopic", "Unknown"),
            "questionCount": len(questions),
            "mcqCount": mc_count,
            "openCount": fr_count,
          }
        )

      source_topics.append(
        {
          "name": topic.get("topic", "Unknown"),
          "questionCount": topic_question_count,
          "subtopics": subtopic_entries,
        }
      )

    summary = {
      "totalQuestions": total_questions,
      "questionTypes": dict(question_type_counts),
      "sourceTopicCount": len(source_topics),
      "sourceTopics": source_topics,
      "uniqueTags": sorted(unique_tags),
    }
    OUTPUT_PATH.write_text(json.dumps(summary, indent=2))
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
