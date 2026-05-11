#!/usr/bin/env python3
"""
FE exam practice question scraper for journey2pe.com
Fixed parser: walks HTML node-by-node, preserving LaTeX and images.
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
    ("https://journey2pe.com/tag/ethics-and-professional-practice/", "fe_ethics_and_professional_practice.json"),
    ("https://journey2pe.com/fe-safety/", "fe_safety.json"),
    ("https://journey2pe.com/fe-mathematics/", "fe_mathematics.json"),
    ("https://journey2pe.com/fe-engineering-probability-and-statistics/", "fe_engineering_probability_and_statistics.json"),
    ("https://journey2pe.com/fe-engineering-economics/", "fe_engineering_economics.json"),
    ("https://journey2pe.com/fe-statics/", "fe_statics.json"),
    ("https://journey2pe.com/fe-dynamics/", "fe_dynamics.json"),
    ("https://journey2pe.com/fe-mechanics-of-materials/", "fe_mechanics_of_materials.json"),
    ("https://journey2pe.com/fe-fluid-mechanics/", "fe_fluid_mechanics.json"),
    ("https://journey2pe.com/fe-thermodynamics/", "fe_thermodynamics.json"),
    ("https://journey2pe.com/fe-heat-transfer/", "fe_heat_transfer.json"),
    ("https://journey2pe.com/fe-basic-electrical-engineering/", "fe_basic_electrical_engineering.json"),
    ("https://journey2pe.com/fe-chemistry-and-biology/", "fe_chemistry_and_biology.json"),
    ("https://journey2pe.com/fe-instrumentation-measurement-and-control/", "fe_instrumentation_measurement_and_control.json"),
    ("https://journey2pe.com/fe-materials-science-structure-of-matter/", "fe_materials_science.json"),
    ("https://journey2pe.com/fe-civil-engineering/", "fe_civil_engineering.json"),
    ("https://journey2pe.com/fe-mechanical-engineering/", "fe_mechanical_engineering.json"),
    ("https://journey2pe.com/fe-environmental-engineering/", "fe_environmental_engineering.json"),
]


def fetch(url, retries=3, delay=2):
    for i in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            r.raise_for_status()
            return r.text
        except Exception as e:
            if i < retries - 1:
                time.sleep(delay * (i + 1))
            else:
                print(f"  ERROR fetching {url}: {e}", file=sys.stderr)
                return None


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
    """
    Walk DOM node-by-node, preserving LaTeX and images.
    Returns a string with interleaved text, LaTeX, and figure links.
    """
    if isinstance(node, NavigableString):
        return str(node)

    if not isinstance(node, Tag):
        return ""

    tag = node.name.lower() if node.name else ""

    # MathJax script tags
    if tag == "script" and node.get("type", "") in ("math/tex", "math/tex; mode=display"):
        content = (node.string or "").strip()
        if "mode=display" in node.get("type", ""):
            return f"\\[{content}\\]"
        return f"\\({content}\\)"

    # Skip script/style
    if tag in ("script", "style", "noscript"):
        return ""

    # Line breaks
    if tag == "br":
        return "\n"

    # Images → markdown link
    if tag == "img":
        src = absolutize_url(node.get("src", ""))
        alt = node.get("alt", "figure")
        return f"[{alt or 'figure'}]({src})"

    if tag == "svg":
        return serialize_inline_svg(node)

    if tag == "math":
        return "\n" + str(node).strip() + "\n"

    # Recurse into children
    parts = []
    for child in node.children:
        parts.append(node_to_text(child))

    result = "".join(parts)

    # Add newline after block elements
    if tag in ("p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"):
        result = result.rstrip("\n") + "\n"

    return result


def clean(text):
    """Clean up whitespace while preserving LaTeX."""
    # Normalize multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def strip_answer_prefix(text):
    return re.sub(r'^\*?\*?answer\*?\*?\s*[:\-]?\s*', '', clean(text), flags=re.I).strip()


def extract_answer_value(text, prefer_choice_letter=False):
    """Return either the MCQ letter or the full answer text for open-response items."""
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


def parse_choices_from_ol(ol_tag):
    """Parse choices from an ordered list."""
    choices = {}
    letters = ["A", "B", "C", "D", "E", "F"]
    items = ol_tag.find_all("li", recursive=False)
    for i, li in enumerate(items):
        if i < len(letters):
            choices[letters[i]] = clean(node_to_text(li))
    return choices


def parse_choices_from_text(text):
    """Try to extract A/B/C/D choices from free text."""
    choices = {}
    # Pattern: (A) text (B) text etc. or A. text B. text
    pattern = r'(?:^|\n)\s*\(?([A-D])[.)]\s*(.*?)(?=\n\s*\(?[A-D][.)]|\Z)'
    matches = re.findall(pattern, text, re.DOTALL)
    for letter, content in matches:
        choices[letter] = clean(content)
    return choices


def parse_tags_refs(soup_section):
    """Extract tags and references from a question block."""
    tags = []
    refs = []

    # Look for tags in footer/meta areas
    for a in soup_section.find_all("a", rel=lambda r: r and "tag" in r):
        tags.append(a.get_text(strip=True))

    # Common reference patterns
    for p in soup_section.find_all("p"):
        txt = p.get_text()
        if re.search(r'reference|ncees|handbook', txt, re.I):
            refs.append(clean(txt))

    return tags, refs


# ─────────────────────────────────────────────
# HTML format parsers
# ─────────────────────────────────────────────

def parse_problem_card(card):
    """
    Format 1: <div class="problem-card">
    Has <details> for the answer.
    """
    questions = []

    # Question text: everything before the <details> (or ol for choices)
    # Usually: .problem-card > (p or divs for question) + ol.choices + details.answer
    question_parts = []
    choices = {}
    answer = ""
    refs = []
    tags_list = []

    details = card.find("details")
    ol = card.find("ol")

    # Collect question text nodes (before ol or details)
    for child in card.children:
        if not isinstance(child, Tag):
            continue
        child_tag = child.name.lower() if child.name else ""
        child_classes = child.get("class", [])
        child_class_str = " ".join(child_classes)

        if child is ol:
            break
        if child is details:
            break
        if child_tag in ("script",):
            continue

        # Skip choice-related divs
        if any(c in child_class_str for c in ("choice", "answer", "solution")):
            continue

        question_parts.append(node_to_text(child))

    question_text = clean("".join(question_parts))

    # Parse choices from ol
    if ol:
        choices = parse_choices_from_ol(ol)

    # Parse answer from details
    if details:
        summary = details.find("summary")
        # Answer is in the details content (after summary)
        ans_parts = []
        for child in details.children:
            if child == summary:
                continue
            ans_parts.append(node_to_text(child))
        ans_text = clean("".join(ans_parts))

        # Also check summary for the answer letter
        if summary:
            sum_text = clean(node_to_text(summary))
            ans_text = sum_text + " " + ans_text

        answer = extract_answer_value(ans_text, prefer_choice_letter=bool(choices))
        if not answer:
            answer = clean(ans_text)[:500]

    if question_text:
        questions.append({
            "question": question_text,
            "choices": choices,
            "answer": answer,
            "references": refs,
            "tags": tags_list,
        })

    return questions


def parse_problem_block(block):
    """
    Format 2: <div class="problem-block"> with <details> wrapper.
    """
    return parse_problem_card(block)


def parse_flat_paragraph(article_soup):
    """
    Format 4: Older posts with no wrapper — problem/choices/answer in plain <p> and <ol> tags.
    Heuristic: look for question patterns in paragraphs.
    """
    questions = []

    content = article_soup.find("div", class_=lambda c: c and any(
        x in c for x in ["entry-content", "post-content", "article-content", "content"]
    ))
    if not content:
        content = article_soup

    # Collect all block-level children
    children = list(content.children)

    i = 0
    while i < len(children):
        child = children[i]
        if not isinstance(child, Tag):
            i += 1
            continue

        tag = child.name.lower() if child.name else ""
        text = clean(node_to_text(child))

        # Detect question start: numbered question or "Problem X"
        is_question_start = bool(re.match(r'^\s*(problem|question|q\.?\s*\d+|^\d+\.)', text, re.I))

        if is_question_start or (tag == "p" and len(text) > 20 and i + 1 < len(children)):
            # Attempt to collect question + choices + answer
            q_text = text
            choices = {}
            answer = ""
            refs_local = []

            i += 1
            # Collect until we hit another question start or end of content
            while i < len(children):
                next_child = children[i]
                if not isinstance(next_child, Tag):
                    i += 1
                    continue
                next_tag = next_child.name.lower() if next_child.name else ""
                next_text = clean(node_to_text(next_child))

                # Stop if new question
                if re.match(r'^\s*(problem|question|q\.?\s*\d+)', next_text, re.I) and len(next_text) > 5:
                    break

                # Choices in ol
                if next_tag == "ol":
                    choices = parse_choices_from_ol(next_child)
                    i += 1
                    continue

                # Answer pattern
                if re.match(r'^\s*(answer|ans|solution)\s*[:\.]?\s*([A-D])', next_text, re.I):
                    answer = extract_answer_value(next_text, prefer_choice_letter=bool(choices))
                    i += 1
                    continue

                # Details tag
                if next_tag == "details":
                    summary = next_child.find("summary")
                    if summary:
                        ans_text = clean(node_to_text(summary))
                        answer = extract_answer_value(ans_text, prefer_choice_letter=bool(choices))
                    i += 1
                    continue

                # Reference
                if re.search(r'reference|ncees|handbook', next_text, re.I):
                    refs_local.append(next_text)
                    i += 1
                    continue

                # If it's a paragraph, might be part of question
                if next_tag == "p" and next_text:
                    # Could be continuation of question if no choices yet
                    if not choices:
                        q_text += "\n" + next_text
                    i += 1
                    continue

                i += 1

            if q_text and len(q_text) > 10:
                questions.append({
                    "question": q_text,
                    "choices": choices,
                    "answer": answer,
                    "references": refs_local,
                    "tags": [],
                })
        else:
            i += 1

    return questions


def parse_article(article_soup, post_title="", post_url=""):
    """
    Parse a single article/post and extract all questions.
    Tries each known format.
    """
    all_questions = []

    # Format 1: problem-card divs
    cards = article_soup.find_all("div", class_=lambda c: c and "problem-card" in c)
    for card in cards:
        qs = parse_problem_card(card)
        all_questions.extend(qs)

    # Format 2: problem-block divs
    blocks = article_soup.find_all("div", class_=lambda c: c and "problem-block" in c)
    for block in blocks:
        qs = parse_problem_block(block)
        all_questions.extend(qs)

    # If nothing found, try flat paragraph format
    if not all_questions:
        all_questions = parse_flat_paragraph(article_soup)

    return all_questions


def get_page_count(soup):
    """Find total page count from pagination."""
    # Look for pagination
    pagination = soup.find("div", class_=lambda c: c and any(
        x in (c if isinstance(c, str) else " ".join(c))
        for x in ["pagination", "page-numbers", "nav-links"]
    ))

    if not pagination:
        pagination = soup.find("nav", class_=lambda c: c and any(
            x in (c if isinstance(c, str) else " ".join(c))
            for x in ["pagination", "page-numbers", "nav-links"]
        ))

    if not pagination:
        return 1

    # Find max page number
    max_page = 1
    for a in pagination.find_all("a"):
        href = a.get("href", "")
        text = a.get_text(strip=True)
        # Look for /page/N/ in href
        m = re.search(r'/page/(\d+)/', href)
        if m:
            max_page = max(max_page, int(m.group(1)))
        # Also check text
        if text.isdigit():
            max_page = max(max_page, int(text))

    return max_page


def get_post_links(soup, base_url):
    """Extract post links from an index/archive page."""
    links = []

    # Common archive link patterns
    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Must be on same domain
        if "journey2pe.com" not in href and not href.startswith("/"):
            continue
        if href.startswith("/"):
            href = BASE_URL + href

        # Skip navigation, tag, category, page links
        if any(x in href for x in ["/tag/", "/category/", "/page/", "/author/", "#", "?", "/feed/"]):
            continue

        # Skip base section URLs themselves
        skip = False
        for sec_url, _ in SECTIONS:
            if href.rstrip("/") == sec_url.rstrip("/"):
                skip = True
                break
        if skip:
            continue

        # Must be a journey2pe.com post (not external)
        if "journey2pe.com" in href and href not in links:
            links.append(href)

    return links


def get_topic_from_article(soup, post_url):
    """Extract topic/subtopic from article metadata."""
    topic = ""
    subtopic = None

    # Try h1 or h2 title
    h1 = soup.find("h1", class_=lambda c: c and any(
        x in (c if isinstance(c, str) else " ".join(c))
        for x in ["entry-title", "post-title", "title"]
    ))
    if not h1:
        h1 = soup.find("h1")
    if h1:
        topic = clean(h1.get_text())

    # Try h2 for subtopic
    h2 = soup.find("h2")
    if h2 and h2.get_text(strip=True) != topic:
        subtopic = clean(h2.get_text())

    if not topic:
        # Extract from URL
        path = post_url.rstrip("/").split("/")[-1]
        topic = path.replace("-", " ").title()

    return topic, subtopic


def scrape_section(section_url, output_filename):
    """Scrape all pages of a section and save to JSON."""
    print(f"\n{'='*60}")
    print(f"Scraping: {section_url}")
    print(f"Output: {output_filename}")

    all_topics = {}  # topic -> {subtopic -> [questions]}
    total_posts = 0

    # Fetch first page to get page count
    html = fetch(section_url)
    if not html:
        print(f"  FAILED to fetch {section_url}")
        return 0

    soup = BeautifulSoup(html, "lxml")
    num_pages = get_page_count(soup)
    print(f"  Found {num_pages} page(s)")

    # Collect all page soups
    page_soups = [soup]
    for page_num in range(2, num_pages + 1):
        page_url = section_url.rstrip("/") + f"/page/{page_num}/"
        page_html = fetch(page_url)
        if page_html:
            page_soups.append(BeautifulSoup(page_html, "lxml"))
        time.sleep(0.5)

    # Collect all post URLs
    post_urls = []
    for page_soup in page_soups:
        links = get_post_links(page_soup, section_url)
        for link in links:
            if link not in post_urls:
                post_urls.append(link)

    print(f"  Found {len(post_urls)} posts")

    # Also check if the section page itself contains questions directly
    # (some pages have inline content, not just post links)
    for page_soup in page_soups:
        direct_cards = page_soup.find_all("div", class_=lambda c: c and ("problem-card" in c or "problem-block" in c))
        if direct_cards:
            print(f"  Found {len(direct_cards)} direct question cards on archive pages")
            for card in direct_cards:
                qs = parse_problem_card(card) if "problem-card" in " ".join(card.get("class", [])) else parse_problem_block(card)
                if qs:
                    topic = "Direct Content"
                    key = (topic, None)
                    if key not in all_topics:
                        all_topics[key] = []
                    all_topics[key].extend(qs)

    # Scrape each post
    for i, post_url in enumerate(post_urls):
        print(f"  [{i+1}/{len(post_urls)}] {post_url}")
        post_html = fetch(post_url)
        if not post_html:
            continue

        post_soup = BeautifulSoup(post_html, "lxml")

        # Get topic from article
        topic, subtopic = get_topic_from_article(post_soup, post_url)

        # Find the article content
        article = post_soup.find("article")
        if not article:
            article = post_soup.find("div", class_=lambda c: c and any(
                x in (c if isinstance(c, str) else " ".join(c))
                for x in ["entry-content", "post-content", "article-content"]
            ))
        if not article:
            article = post_soup

        questions = parse_article(article, topic, post_url)

        if questions:
            key = (topic, subtopic)
            if key not in all_topics:
                all_topics[key] = []
            all_topics[key].extend(questions)
            total_posts += 1
            print(f"    → {len(questions)} question(s) for topic: {topic}")
        else:
            print(f"    → 0 questions found (skipping)")

        time.sleep(0.8)  # Be polite

    # Build output JSON
    topics_list = []
    for (topic, subtopic), questions in all_topics.items():
        topics_list.append({
            "topic": topic,
            "subtopic": subtopic,
            "questions": questions,
        })

    output = {"topics": topics_list}

    output_path = OUTPUT_DIR / output_filename
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # QA summary
    total_q = sum(len(t["questions"]) for t in topics_list)
    empty_answer = sum(1 for t in topics_list for q in t["questions"] if not q["answer"])
    empty_question = sum(1 for t in topics_list for q in t["questions"] if not q["question"])

    print(f"\n  QA: {total_q} questions | {empty_answer} empty answers | {empty_question} empty questions")
    print(f"  Saved to {output_filename}")

    return total_q


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Which sections to process (can pass indices as args)
    if len(sys.argv) > 1:
        indices = [int(x) for x in sys.argv[1:]]
        sections_to_process = [SECTIONS[i] for i in indices if i < len(SECTIONS)]
    else:
        sections_to_process = SECTIONS

    results = []
    for section_url, output_filename in sections_to_process:
        count = scrape_section(section_url, output_filename)
        section_name = output_filename.replace(".json", "").replace("_", " ").title()
        results.append((section_name, count))
        time.sleep(1)

    print("\n" + "="*60)
    print("FINAL SUMMARY")
    print("="*60)
    for name, count in results:
        status = "✓" if count > 0 else "✗"
        print(f"  {status} {name}: {count} questions")


if __name__ == "__main__":
    main()
