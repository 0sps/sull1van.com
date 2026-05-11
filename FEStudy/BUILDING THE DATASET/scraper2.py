#!/usr/bin/env python3
"""
FE exam practice question scraper for journey2pe.com - v2
Architecture:
  - Section pages list subtopics as /tag/ links
  - Tag pages contain articles (one per question), paginated
  - Articles have problem-card, problem-block, or flat paragraph format
Fixed parser: node-by-node HTML traversal preserving LaTeX and images.
"""

import json
import os
from pathlib import Path
import re
import sys
import time
import requests
from bs4 import BeautifulSoup, NavigableString, Tag

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = Path(os.environ.get("SCRAPER_OUTPUT_DIR", BASE_DIR / "outputs"))
BASE_URL = "https://journey2pe.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

SECTIONS = [
    ("https://journey2pe.com/tag/ethics-and-professional-practice/", "fe_ethics_and_professional_practice.json", "Ethics and Professional Practice"),
    ("https://journey2pe.com/fe-safety/", "fe_safety.json", "Safety"),
    ("https://journey2pe.com/fe-mathematics/", "fe_mathematics.json", "Mathematics"),
    ("https://journey2pe.com/fe-engineering-probability-and-statistics/", "fe_engineering_probability_and_statistics.json", "Engineering Probability and Statistics"),
    ("https://journey2pe.com/fe-engineering-economics/", "fe_engineering_economics.json", "Engineering Economics"),
    ("https://journey2pe.com/fe-statics/", "fe_statics.json", "Statics"),
    ("https://journey2pe.com/fe-dynamics/", "fe_dynamics.json", "Dynamics"),
    ("https://journey2pe.com/fe-mechanics-of-materials/", "fe_mechanics_of_materials.json", "Mechanics of Materials"),
    ("https://journey2pe.com/fe-fluid-mechanics/", "fe_fluid_mechanics.json", "Fluid Mechanics"),
    ("https://journey2pe.com/fe-thermodynamics/", "fe_thermodynamics.json", "Thermodynamics"),
    ("https://journey2pe.com/fe-heat-transfer/", "fe_heat_transfer.json", "Heat Transfer"),
    ("https://journey2pe.com/fe-basic-electrical-engineering/", "fe_basic_electrical_engineering.json", "Basic Electrical Engineering"),
    ("https://journey2pe.com/fe-chemistry-and-biology/", "fe_chemistry_and_biology.json", "Chemistry and Biology"),
    ("https://journey2pe.com/fe-instrumentation-measurement-and-control/", "fe_instrumentation_measurement_and_control.json", "Instrumentation, Measurement and Control"),
    ("https://journey2pe.com/fe-materials-science-structure-of-matter/", "fe_materials_science.json", "Materials Science"),
    ("https://journey2pe.com/fe-civil-engineering/", "fe_civil_engineering.json", "Civil Engineering"),
    ("https://journey2pe.com/fe-mechanical-engineering/", "fe_mechanical_engineering.json", "Mechanical Engineering"),
    ("https://journey2pe.com/fe-environmental-engineering/", "fe_environmental_engineering.json", "Environmental Engineering"),
]


def fetch(url, retries=3):
    for i in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            r.raise_for_status()
            return r.text
        except Exception as e:
            wait = 2 * (i + 1)
            print(f"    WARN: fetch failed ({e}), retry in {wait}s ...", file=sys.stderr)
            if i < retries - 1:
                time.sleep(wait)
            else:
                print(f"    ERROR: giving up on {url}", file=sys.stderr)
                return None


# ─────────────────────────────────────────────
# Node-by-node HTML → text with LaTeX + images
# ─────────────────────────────────────────────

def absolutize_url(url):
    if not url:
        return url
    if url.startswith(("http://", "https://", "data:", "#")):
        return url
    return BASE_URL + (url if url.startswith("/") else "/" + url)


def serialize_inline_svg(node):
    """Preserve inline SVG diagrams so the dataset can render them later."""
    svg_html = str(node)
    svg_html = re.sub(
        r'((?:href|xlink:href|src)=["\'])(?!https?://|data:|#)([^"\']+)(["\'])',
        lambda m: f"{m.group(1)}{absolutize_url(m.group(2))}{m.group(3)}",
        svg_html,
    )
    return "\n" + svg_html.strip() + "\n"


def node_to_text(node):
    """Walk DOM node-by-node. Preserves LaTeX strings and img as markdown links."""
    if isinstance(node, NavigableString):
        return str(node)
    if not isinstance(node, Tag):
        return ""

    tag = (node.name or "").lower()

    if tag == "script" and node.get("type", "") in ("math/tex", "math/tex; mode=display"):
        content = (node.string or "").strip()
        return f"\\[{content}\\]" if "mode=display" in node.get("type", "") else f"\\({content}\\)"

    if tag in ("script", "style", "noscript"):
        return ""

    if tag == "br":
        return "\n"

    if tag == "img":
        src = absolutize_url(node.get("src", ""))
        alt = node.get("alt", "figure") or "figure"
        return f"[{alt}]({src})" if src else ""

    if tag == "svg":
        return serialize_inline_svg(node)

    if tag == "math":
        return "\n" + str(node).strip() + "\n"

    # Recurse
    parts = [node_to_text(c) for c in node.children]
    text = "".join(parts)

    if tag in ("p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6",
               "blockquote", "pre", "tr"):
        text = text.rstrip("\n") + "\n"

    return text


def clean(text):
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def strip_answer_prefix(text):
    return re.sub(r'^\*?\*?answer\*?\*?\s*[:\-]?\s*', '', clean(text), flags=re.I).strip()


def extract_answer_value(text, prefer_choice_letter=False):
    """Return either a choice letter for MCQ items or the full answer text for open-response items."""
    normalized = strip_answer_prefix(text)
    if not normalized:
        return ""
    if prefer_choice_letter:
        m = re.fullmatch(r'\(?\s*([A-D])\s*\)?\.?', normalized, re.I)
        if m:
            return m.group(1).upper()
        m = re.match(r'^([A-D])(?:\s|$)', normalized, re.I)
        if m and not re.match(r'^[A-D]\s*=', normalized, re.I):
            return m.group(1).upper()
    return normalized[:300]


# ─────────────────────────────────────────────
# Parse individual article content
# ─────────────────────────────────────────────

def parse_problem_card(card):
    """
    <div class="problem-card"> or <div class="problem-block">
    Structure:
      - <p><strong>Problem:</strong></p>
      - <p>question text</p>  (may be multiple <p>)
      - <p><strong>Options:</strong></p>  (optional)
      - <ol type="A"><li>...</li></ol>     (choices, optional)
      - <details>
          <summary>...</summary>
          <div class="solution-body">
            <p><strong>Answer:</strong> A</p>
            ...references...
          </div>
        </details>
    """
    question_parts = []
    choices = {}
    answer = ""
    references = []

    children = list(card.children)
    i = 0

    # State machine: collect question text, then choices, then answer from details
    in_question = False
    in_options = False

    for child in children:
        if not isinstance(child, Tag):
            continue
        tag = (child.name or "").lower()
        text = clean(node_to_text(child))

        # Skip empty
        if not text.strip():
            continue

        # Detect section headers
        text_lower = text.lower()

        if re.search(r'\bproblem\b', text_lower) and len(text) < 50:
            in_question = True
            in_options = False
            continue

        if re.search(r'\boptions?\b|\bchoices?\b', text_lower) and len(text) < 50:
            in_options = True
            continue

        if tag == "details":
            # Parse answer and references from details
            solution_body = child.find("div", class_="solution-body")
            if not solution_body:
                solution_body = child

            # Extract answer line
            for p in solution_body.find_all("p"):
                p_text = clean(node_to_text(p))
                if re.match(r'\*?\*?answer\*?\*?', p_text, re.I):
                    answer = extract_answer_value(p_text, prefer_choice_letter=bool(choices))
                    break

            # Extract references
            for p in solution_body.find_all(["p", "li"]):
                p_text = clean(node_to_text(p))
                if re.search(r'(?:fe\s*ref|handbook|ncees|p\d+)', p_text, re.I) and len(p_text) < 200:
                    if p_text not in references:
                        references.append(p_text)
            continue

        if tag == "ol" and in_options:
            letters = ["A", "B", "C", "D", "E", "F"]
            for idx, li in enumerate(child.find_all("li", recursive=False)):
                if idx < len(letters):
                    choices[letters[idx]] = clean(node_to_text(li))
            in_options = False
            continue

        if in_question and not in_options:
            if text:
                question_parts.append(text)

        elif not in_question:
            # Before "Problem:" header — could be question for older format
            if text and tag in ("p",):
                question_parts.append(text)

    question = clean("\n".join(question_parts))

    # Fallback: if no answer found from details, try to find it in card text
    if not answer:
        full_text = clean(node_to_text(card))
        m = re.search(r'\*?\*?answer\*?\*?\s*[:\-]?\s*([A-D])\b', full_text, re.I)
        if m:
            answer = m.group(1).upper()

    if not question:
        return None

    return {
        "question": question,
        "choices": choices,
        "answer": answer,
        "references": references,
        "tags": [],
    }


def parse_flat_article(article):
    """
    Flat paragraph format (no problem-card wrapper):
      <p><strong>Problem:</strong></p>
      <p>question text</p>
      <p><strong>Answer:</strong> \\(...\\)</p>
    Or with choices in <ol>.
    """
    entry = article.find("div", class_="entry-content")
    if not entry:
        entry = article

    children = list(entry.children)

    question_parts = []
    choices = {}
    answer = ""
    references = []

    in_question = False
    in_options = False
    in_solution = False
    expecting_answer_content = False  # True when "Answer:" label was empty

    for child in children:
        if not isinstance(child, Tag):
            continue
        tag = (child.name or "").lower()
        text = clean(node_to_text(child))

        if not text.strip():
            continue

        text_lower = text.lower()

        # If previous line was a bare "Answer:" label, this line IS the answer value
        if expecting_answer_content:
            expecting_answer_content = False
            answer = extract_answer_value(text, prefer_choice_letter=bool(choices))
            in_solution = True
            in_question = False
            continue

        if re.search(r'^\*?\*?problem\*?\*?\s*[:\.]?\s*$', text_lower.strip()):
            in_question = True
            in_options = False
            in_solution = False
            continue

        if re.search(r'^\*?\*?options?\*?\*?\s*[:\.]?\s*$', text_lower.strip()):
            in_options = True
            continue

        if re.search(r'^\*?\*?answer\*?\*?\s*[:\-]', text_lower.strip()):
            answer_text = re.sub(r'^\*?\*?answer\*?\*?\s*[:\-]\s*', '', text, flags=re.I)
            if answer_text.strip():
                answer = extract_answer_value(answer_text, prefer_choice_letter=bool(choices))
                in_solution = True
                in_question = False
            else:
                # Answer label is empty — value is in the NEXT sibling element
                expecting_answer_content = True
            continue

        if re.search(r'^\*?\*?solution\*?\*?\s*[:\.]?\s*$', text_lower.strip()):
            in_solution = True
            in_question = False
            continue

        if tag == "details":
            # Same as in problem-card
            solution_body = child.find("div", class_="solution-body")
            if not solution_body:
                solution_body = child
            for p in solution_body.find_all("p"):
                p_text = clean(node_to_text(p))
                if re.match(r'\*?\*?answer\*?\*?', p_text, re.I):
                    answer = extract_answer_value(p_text, prefer_choice_letter=bool(choices))
                    break
            for p in solution_body.find_all(["p", "li"]):
                p_text = clean(node_to_text(p))
                if re.search(r'(?:fe\s*ref|handbook|ncees|p\d+)', p_text, re.I) and len(p_text) < 200:
                    if p_text not in references:
                        references.append(p_text)
            continue

        if tag == "ol" and in_options:
            letters = ["A", "B", "C", "D", "E", "F"]
            for idx, li in enumerate(child.find_all("li", recursive=False)):
                if idx < len(letters):
                    choices[letters[idx]] = clean(node_to_text(li))
            in_options = False
            continue

        if re.search(r'(?:fe\s*ref|handbook|ncees)', text_lower) and len(text) < 200 and in_solution:
            references.append(text)
            continue

        if in_question and not in_options and not in_solution:
            question_parts.append(text)

    question = clean("\n".join(question_parts))

    if not question:
        return None

    # Fallback for free-form compute posts with no explicit "Answer:" label:
    # Extract the last math block or concluding sentence from the solution.
    if not answer and not choices:
        full_html_text = node_to_text(entry)
        # 1. Last \[...\] display block
        display_blocks = re.findall(r'\\\[[\s\S]*?\\\]', full_html_text)
        if display_blocks:
            answer = clean(display_blocks[-1])
        # 2. Last \(...\) inline block
        if not answer:
            inline_blocks = re.findall(r'\\\([\s\S]*?\\\)', full_html_text)
            if inline_blocks:
                answer = clean(inline_blocks[-1])
        # 3. Last sentence containing "is" or "=" (plain-text answers)
        if not answer:
            sentences = re.split(r'(?<=[.!?])\s+', full_html_text.replace('\n', ' '))
            for sent in reversed(sentences):
                sent = sent.strip()
                if sent and re.search(r'\b(is|are|=)\b', sent, re.I) and len(sent) < 200:
                    answer = sent
                    break

    return {
        "question": question,
        "choices": choices,
        "answer": answer,
        "references": references,
        "tags": [],
    }


def parse_article(article):
    """Parse a single article element into a question dict."""
    entry = article.find("div", class_="entry-content")
    if not entry:
        entry = article

    # Format 1: problem-card
    card = entry.find("div", class_=lambda c: c and "problem-card" in " ".join(c if isinstance(c, list) else [c]))
    if card:
        return parse_problem_card(card)

    # Format 2: problem-block
    block = entry.find("div", class_=lambda c: c and "problem-block" in " ".join(c if isinstance(c, list) else [c]))
    if block:
        return parse_problem_card(block)

    # Format 3/4: flat paragraph
    return parse_flat_article(article)


def get_article_tags(article):
    """Extract tags from article CSS classes (e.g., tag-straight-line)."""
    classes = article.get("class", [])
    tags = []
    for cls in classes:
        if cls.startswith("tag-"):
            tag_name = cls[4:].replace("-", " ").title()
            # Filter out section-level tags
            if not any(sec in tag_name.lower() for sec in ["mathematics", "physics", "chemistry"]):
                tags.append(tag_name)
    return tags


def get_page_count_from_soup(soup):
    """Find max page number from pagination."""
    max_page = 1
    nav = soup.find("div", class_="nav-links")
    if not nav:
        nav = soup.find(class_=lambda c: c and "page-numbers" in " ".join(c if isinstance(c, list) else [c]))
    if nav:
        for a in nav.find_all("a", href=True):
            href = a["href"]
            m = re.search(r'/page/(\d+)/', href)
            if m:
                max_page = max(max_page, int(m.group(1)))
            txt = a.get_text(strip=True)
            if txt.isdigit():
                max_page = max(max_page, int(txt))
    return max_page


# ─────────────────────────────────────────────
# Tag page scraper
# ─────────────────────────────────────────────

def scrape_tag_page(tag_url, subtopic_name):
    """
    Scrape all pages of a tag archive, return list of question dicts.
    """
    questions = []

    html = fetch(tag_url)
    if not html:
        return questions

    soup = BeautifulSoup(html, "lxml")
    num_pages = get_page_count_from_soup(soup)

    page_soups = [soup]
    for pg in range(2, num_pages + 1):
        pg_url = tag_url.rstrip("/") + f"/page/{pg}/"
        pg_html = fetch(pg_url)
        if pg_html:
            page_soups.append(BeautifulSoup(pg_html, "lxml"))
        time.sleep(0.5)

    for page_soup in page_soups:
        for article in page_soup.find_all("article"):
            q = parse_article(article)
            if q:
                # Add subtopic tag
                article_tags = get_article_tags(article)
                q["tags"] = article_tags if article_tags else [subtopic_name]
                questions.append(q)

    return questions


# ─────────────────────────────────────────────
# Section scraper
# ─────────────────────────────────────────────

def get_tag_links_from_section(section_url):
    """
    From a section page, extract tag links with their display names.
    Returns list of (subtopic_name, tag_url).
    """
    html = fetch(section_url)
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")

    results = []
    seen = set()

    # Find the article content
    article = soup.find("article")
    if article:
        for a in article.find_all("a", href=True):
            href = a["href"]
            if "/tag/" in href and href not in seen:
                # Use only the anchor's OWN first text node to avoid absorbing
                # malformed nested content from adjacent list items
                from bs4 import NavigableString
                name = ""
                for child in a.children:
                    if isinstance(child, NavigableString):
                        name = str(child).strip()
                        if name:
                            break
                if not name:
                    name = a.get_text(strip=True)
                # Truncate at first newline (catches merged text blobs)
                name = name.split("\n")[0].strip()
                if name:
                    results.append((name, href))
                    seen.add(href)

    return results


def scrape_section(section_url, output_filename, section_name, section_idx=None):
    """Scrape a full section and write to JSON."""
    print(f"\n{'='*60}")
    print(f"[{section_idx}] {section_name}")
    print(f"URL: {section_url}")

    topics_list = []

    if "/tag/" in section_url:
        # Direct tag URL (e.g., ethics) — single subtopic
        tag_name = section_url.rstrip("/").split("/tag/")[-1].replace("-", " ").title()
        print(f"  Direct tag: {tag_name}")
        qs = scrape_tag_page(section_url, tag_name)
        print(f"  {tag_name}: {len(qs)} questions")
        topics_list.append({
            "topic": section_name,
            "subtopic": tag_name,
            "questions": qs,
        })
    else:
        # Section page with tag links
        tag_links = get_tag_links_from_section(section_url)
        print(f"  Subtopics found: {len(tag_links)}")
        for subtopic_name, tag_url in tag_links:
            print(f"  → {subtopic_name} ({tag_url})")
            qs = scrape_tag_page(tag_url, subtopic_name)
            print(f"    {len(qs)} questions")
            topics_list.append({
                "topic": section_name,
                "subtopic": subtopic_name,
                "questions": qs,
            })
            time.sleep(0.8)

    # Write output
    output = {"topics": topics_list}
    output_path = OUTPUT_DIR / output_filename
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # QA
    total_q = sum(len(t["questions"]) for t in topics_list)
    empty_ans = sum(1 for t in topics_list for q in t["questions"] if not q.get("answer"))
    empty_q = sum(1 for t in topics_list for q in t["questions"] if not q.get("question"))
    print(f"\n  ✓ {section_name}: {total_q} questions | {empty_ans} empty answers | {empty_q} empty question texts")
    print(f"  Saved → {output_filename}")

    return total_q, empty_ans, empty_q


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if len(sys.argv) > 1:
        indices = [int(x) for x in sys.argv[1:]]
        sections_to_run = [(i, SECTIONS[i]) for i in indices if i < len(SECTIONS)]
    else:
        sections_to_run = list(enumerate(SECTIONS))

    summary = []
    for idx, (url, filename, name) in sections_to_run:
        total, empty_ans, empty_q = scrape_section(url, filename, name, idx)
        summary.append((name, total, empty_ans, empty_q))
        time.sleep(1.0)

    print("\n" + "="*60)
    print("FINAL SUMMARY")
    print("="*60)
    grand_total = 0
    for name, total, ea, eq in summary:
        flag = " ⚠" if ea > 0 or eq > 0 else ""
        print(f"  ✓ {name}: {total} questions (empty_ans={ea}, empty_q={eq}){flag}")
        grand_total += total
    print(f"\n  GRAND TOTAL: {grand_total} questions")


if __name__ == "__main__":
    main()
