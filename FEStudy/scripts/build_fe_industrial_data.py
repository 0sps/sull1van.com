#!/usr/bin/env python3

import json
import re
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from question_bank_loader import load_question_bank


ROOT = Path(__file__).resolve().parent.parent
BLUEPRINT_PATH = ROOT / "data" / "fe_industrial_blueprint.json"
MAP_PATH = ROOT / "data" / "question_topic_map.json"
SUMMARY_PATH = ROOT / "data" / "question_bank_summary.json"
NORMALIZED_JSON_PATH = ROOT / "data" / "normalized-question-bank.json"
APP_DATA_JS_PATH = ROOT / "data" / "app-data.js"
COVERAGE_PATH = ROOT / "data" / "coverage_report.json"

SAFE_HTML_TAGS = {
    "a", "b", "br", "circle", "clippath", "code", "dd", "defs", "div", "dl", "dt", "em", "g", "i", "li",
    "line", "marker", "ol", "p", "path", "pattern", "polygon", "polyline", "pre", "rect", "small", "span",
    "strong", "sub", "sup", "svg", "table", "tbody", "td", "text", "tfoot", "th", "thead", "tr", "tspan",
    "u", "ul",
}
SAFE_HTML_ATTRIBUTES = {
    "alignment-baseline", "aria-hidden", "baseline-shift", "clip-path", "cx", "cy", "d", "dy", "fill",
    "fill-opacity", "font-family", "font-size", "font-style", "font-weight", "height", "href", "id", "marker-end",
    "marker-start", "markerheight", "markerwidth", "opacity", "orient", "patterntransform", "patternunits", "points",
    "r", "refx", "refy", "rel", "role", "scope", "stroke", "stroke-dasharray", "stroke-linecap", "stroke-linejoin",
    "stroke-width", "style", "target", "text-anchor", "title", "transform", "viewbox", "width", "x", "x1", "x2",
    "xmlns", "y", "y1", "y2",
}
SVG_REFERENCE_ATTRIBUTES = {"clip-path", "marker-end", "marker-start"}
SVG_PAINT_ATTRIBUTES = {"fill", "stroke"}
SAFE_STYLE_PROPERTIES = {"display", "height", "margin", "max-width", "width"}
SVG_CLASS_PRESENTATION_ATTRIBUTES = {
    "line": {"stroke": "black", "stroke-width": "2", "fill": "none"},
    "label": {"font-family": "serif", "font-size": "14px", "font-style": "italic"},
    "node-label": {"font-family": "sans-serif", "font-size": "14px", "font-weight": "bold"},
}
STYLE_TAG_PATTERN = re.compile(r"<style\b[^>]*>[\s\S]*?</style\s*>", re.IGNORECASE)
CLASS_TAG_PATTERN = re.compile(r"<[^>]+\bclass\s*=\s*([\"'])([^\"']+)\1[^>]*>", re.IGNORECASE)


def _set_tag_attribute(tag, name, value):
    attribute_pattern = re.compile(rf"\s{name}\s*=\s*([\"'])[^\"']*\1", re.IGNORECASE)
    replacement = f' {name}="{value}"'
    if attribute_pattern.search(tag):
        return attribute_pattern.sub(replacement, tag, count=1)
    closing = "/>" if tag.endswith("/>") else ">"
    return tag[:-len(closing)] + replacement + closing


def normalize_question_markup(markup):
    if not isinstance(markup, str) or "<" not in markup:
        return markup

    def inline_known_svg_class(match):
        tag = match.group(0)
        classes = match.group(2).split()
        unknown_classes = [name for name in classes if name not in SVG_CLASS_PRESENTATION_ATTRIBUTES]
        if unknown_classes:
            raise ValueError(f"Unsupported generated SVG class: {', '.join(unknown_classes)}")
        tag = re.sub(r"\sclass\s*=\s*([\"'])[^\"']+\1", "", tag, count=1, flags=re.IGNORECASE)
        for class_name in classes:
            for name, value in SVG_CLASS_PRESENTATION_ATTRIBUTES[class_name].items():
                tag = _set_tag_attribute(tag, name, value)
        return tag

    normalized = CLASS_TAG_PATTERN.sub(inline_known_svg_class, markup)
    return STYLE_TAG_PATTERN.sub("", normalized)


def is_safe_inline_style(value):
    for declaration in str(value).split(";"):
        declaration = declaration.strip()
        if not declaration:
            continue
        if ":" not in declaration:
            return False
        property_name, property_value = (part.strip() for part in declaration.split(":", 1))
        if property_name.lower() not in SAFE_STYLE_PROPERTIES:
            return False
        if not re.fullmatch(r"[a-z0-9.%+\-\s]+", property_value, re.IGNORECASE):
            return False
        if re.search(r"expression\s*\(|url\s*\(|@import|javascript:", property_value, re.IGNORECASE):
            return False
    return True


def is_safe_attribute_value(name, value):
    normalized = re.sub(r"[\x00-\x20\x7f\s]+", "", str(value)).lower()
    if name == "href":
        return normalized == "" or normalized.startswith(("#", "http://", "https://"))
    if name in SVG_REFERENCE_ATTRIBUTES:
        return normalized == "none" or re.fullmatch(r"url\(#[a-z0-9_.:-]+\)", normalized, re.IGNORECASE) is not None
    if name in SVG_PAINT_ATTRIBUTES and "url(" in normalized:
        return re.fullmatch(r"url\(#[a-z0-9_.:-]+\)", normalized, re.IGNORECASE) is not None
    if name == "style":
        return is_safe_inline_style(value)
    return True


class MarkupPolicyValidator(HTMLParser):
    def __init__(self, question_id, field_name):
        super().__init__(convert_charrefs=True)
        self.question_id = question_id
        self.field_name = field_name
        self.errors = []

    def handle_starttag(self, tag, attrs):
        normalized_tag = tag.lower()
        if normalized_tag not in SAFE_HTML_TAGS:
            self.errors.append(f"unsupported tag <{tag}>")
        for name, value in attrs:
            normalized_name = name.lower()
            if normalized_name.startswith("on") or normalized_name not in SAFE_HTML_ATTRIBUTES:
                self.errors.append(f"unsupported attribute {name} on <{tag}>")
            elif not is_safe_attribute_value(normalized_name, value or ""):
                self.errors.append(f"unsafe value for {name} on <{tag}>")

    handle_startendtag = handle_starttag


def validate_generated_markup(questions):
    failures = []
    for question in questions:
        fields = [("stem", question.get("stem", ""))]
        fields.extend((f"choice {key}", value) for key, value in question.get("choices", {}).items() if isinstance(value, str))
        for field_name, markup in fields:
            validator = MarkupPolicyValidator(question.get("id", "unknown"), field_name)
            validator.feed(markup)
            if validator.errors:
                failures.append(f"{validator.question_id} {field_name}: " + "; ".join(sorted(set(validator.errors))))
    if failures:
        raise ValueError("Generated question markup violates the rendering policy:\n" + "\n".join(failures))


def normalize_text(parts):
    return " ".join(part for part in parts if part).lower()


def keyword_score(haystack, keywords, weight):
    score = 0
    for keyword in keywords:
        if keyword.lower() in haystack:
            score += weight
    return score


def detect_question_type(question):
    choices = question.get("choices", {})
    answer = question.get("answer", "")
    if isinstance(choices, dict) and len(choices) >= 2 and answer in {"A", "B", "C", "D"}:
        return "mcq"
    return "open"


def iter_subtopics(topic):
    nested_subtopics = topic.get("subtopics")
    if isinstance(nested_subtopics, list) and nested_subtopics:
        return nested_subtopics
    direct_questions = topic.get("questions", [])
    if direct_questions:
        return [{"subtopic": topic.get("subtopic") or topic.get("topic") or "General", "questions": direct_questions}]
    return []


def match_section(question_blob, source_topic, section_rules):
    best_rule = None
    best_score = 0
    for rule in section_rules:
        score = 0
        if source_topic in rule.get("sourceTopics", []):
            score += 8
        score += keyword_score(question_blob, rule.get("keywords", []), 2)
        if score > best_score:
            best_rule = rule
            best_score = score
    return best_rule if best_score > 0 else None


def match_subtopic(question_blob, subtopic_rules, section_rule=None, source_topic=None):
    if section_rule and source_topic:
        override = section_rule.get("sourceTopicSubtopicOverrides", {}).get(source_topic)
        if override:
            return override
    best_name = None
    best_score = -1
    for rule in subtopic_rules:
        score = keyword_score(question_blob, rule.get("keywords", []), 1)
        if score > best_score:
          best_name = rule.get("name")
          best_score = score
    return best_name or (subtopic_rules[0].get("name") if subtopic_rules else "General")


def compute_estimate(correct, answered):
    if answered <= 0:
        return None
    accuracy = correct / answered
    confidence = min(answered / 5, 1)
    return round(accuracy * (0.35 + 0.65 * confidence) * 100)


def build_section_lookup(sections):
    return {section["id"]: section for section in sections}


def main():
    raw_payload = load_question_bank(ROOT)
    blueprint = json.loads(BLUEPRINT_PATH.read_text())
    mapping = json.loads(MAP_PATH.read_text())
    sections = blueprint["sections"]
    section_lookup = build_section_lookup(sections)
    section_rules = mapping["sectionRules"]

    normalized_questions = []
    unmatched_questions = []
    per_section = defaultdict(lambda: {"questionCount": 0, "mcqCount": 0, "openCount": 0, "subtopics": defaultdict(int)})

    for source_topic in raw_payload.get("topics", []):
        source_topic_name = source_topic.get("topic", "Unknown")
        for source_subtopic in iter_subtopics(source_topic):
            source_subtopic_name = source_subtopic.get("subtopic", "Unknown")
            for question in source_subtopic.get("questions", []):
                question_text = normalize_question_markup(question.get("question", ""))
                tags = question.get("tags", [])
                question_type = detect_question_type(question)

                # Priority 1: inline fields baked into the source question
                if question.get("sectionId") and question.get("officialSubtopic"):
                    section_id = question["sectionId"]
                    section = section_lookup[section_id]
                    official_subtopic = question["officialSubtopic"]
                else:
                    # Priority 2: keyword heuristic fallback
                    blob = normalize_text(
                        [
                            source_topic_name,
                            source_subtopic_name,
                            question.get("id", ""),
                            question_text,
                            " ".join(tags),
                        ]
                    )
                    section_rule = match_section(blob, source_topic_name, section_rules)

                    if not section_rule:
                        unmatched_questions.append(
                            {
                                "id": question.get("id"),
                                "sourceTopic": source_topic_name,
                                "sourceSubtopic": source_subtopic_name,
                                "tags": tags,
                                "type": question_type,
                            }
                        )
                        continue

                    section_id = section_rule["id"]
                    section = section_lookup[section_id]
                    official_subtopic = match_subtopic(
                        blob,
                        section_rule.get("subtopicRules", []),
                        section_rule=section_rule,
                        source_topic=source_topic_name,
                    )
                choices = {
                    key: normalize_question_markup(value) if isinstance(value, str) else value
                    for key, value in question.get("choices", {}).items()
                }
                normalized_question = {
                    "id": question.get("id"),
                    "stem": question_text,
                    "choices": choices,
                    "answer": question.get("answer"),
                    "type": question_type,
                    "sourceTopic": source_topic_name,
                    "sourceSubtopic": source_subtopic_name,
                    "sourceTags": tags,
                    "references": question.get("references", []),
                    "url": question.get("url"),
                    "sectionId": section_id,
                    "sectionTitle": section["title"],
                    "officialSubtopic": official_subtopic,
                }
                normalized_questions.append(normalized_question)

                section_stats = per_section[section_id]
                section_stats["questionCount"] += 1
                section_stats["subtopics"][official_subtopic] += 1
                if question_type == "mcq":
                    section_stats["mcqCount"] += 1
                else:
                    section_stats["openCount"] += 1

    summary_payload = json.loads(SUMMARY_PATH.read_text()) if SUMMARY_PATH.exists() else {}
    coverage_sections = []
    for section in sections:
        stats = per_section[section["id"]]
        coverage_sections.append(
            {
                "id": section["id"],
                "title": section["title"],
                "questionRange": section["questionRange"],
                "mappedQuestionCount": stats["questionCount"],
                "mcqCount": stats["mcqCount"],
                "openCount": stats["openCount"],
                "subtopicCoverage": [
                    {"name": subtopic, "count": stats["subtopics"].get(subtopic, 0)}
                    for subtopic in section["subtopics"]
                ],
            }
        )

    coverage_report = {
        "exam": blueprint["exam"],
        "totalSourceQuestions": summary_payload.get("totalQuestions", len(normalized_questions) + len(unmatched_questions)),
        "mappedQuestionCount": len(normalized_questions),
        "unmatchedQuestionCount": len(unmatched_questions),
        "sections": coverage_sections,
        "unmatchedSample": unmatched_questions[:50],
    }

    validate_generated_markup(normalized_questions)

    NORMALIZED_JSON_PATH.write_text(json.dumps(normalized_questions, indent=2))
    COVERAGE_PATH.write_text(json.dumps(coverage_report, indent=2))

    app_payload = {
        "exam": blueprint["exam"],
        "generatedAt": __import__("datetime").datetime.now().isoformat(),
        "scoreModel": {
            "description": "confidence-adjusted accuracy",
            "formula": "accuracy * (0.35 + 0.65 * min(answered/5, 1)) * 100",
            "helperSample": compute_estimate(4, 5),
        },
        "sections": coverage_sections,
        "questions": normalized_questions,
        "coverageReport": {
            "mappedQuestionCount": len(normalized_questions),
            "unmatchedQuestionCount": len(unmatched_questions),
        },
    }
    APP_DATA_JS_PATH.write_text("window.FEQuizData = " + json.dumps(app_payload, separators=(",", ":")) + ";")
    print(f"Wrote {NORMALIZED_JSON_PATH}")
    print(f"Wrote {COVERAGE_PATH}")
    print(f"Wrote {APP_DATA_JS_PATH}")


if __name__ == "__main__":
    main()
