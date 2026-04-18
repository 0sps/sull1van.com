# FE Industrial Question Recategorization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reclassify every FE Industrial question to the new topic/subtopic taxonomy using 10 parallel `gpt-5.4-mini` subagents and feed the explicit results into the dataset build pipeline.

**Architecture:** Use the normalized question bank as the stable source input, split it into 10 deterministic batches, collect explicit per-question classifications from subagents, merge and validate them into a dedicated source file, then rebuild generated app data from that file. The build script will treat explicit per-question assignments as the primary source of truth and retain existing heuristics only as fallback.

**Tech Stack:** Python, JSON, existing FEStudy build scripts, Codex subagents

---

### Task 1: Prepare taxonomy and batch-generation inputs

**Files:**
- Create: `data/question_taxonomy_overrides.json`
- Create: `scripts/generate_question_recategorization_batches.py`
- Create: `data/recategorization_batches/`

**Step 1: Define the canonical allowed section/subtopic taxonomy.**

Store the exact user-approved sections/subtopics in a machine-readable structure that batch generation and validation can reuse.

**Step 2: Write a batch-generation script.**

Input: `data/normalized-question-bank.json`
Output: 10 JSON files in `data/recategorization_batches/` with roughly equal question counts.

Each batch record should include:
- `questionId`
- `sourceTopic`
- `sourceSubtopic`
- `type`
- `stem`
- `choices`

**Step 3: Run the batch-generation script and confirm all questions are covered once.**

Run: `python3 scripts/generate_question_recategorization_batches.py`

Expected:
- 10 batch files written
- total records equals normalized question count
- no duplicate question IDs across batches

### Task 2: Dispatch 10 classification subagents and collect outputs

**Files:**
- Create: `data/recategorization_results/`
- Create: `docs/plans/2026-04-18-question-recategorization-agent-instructions.md`

**Step 1: Save the exact agent instructions.**

Document the classification rubric, allowed outputs, and required JSON schema.

**Step 2: Spawn 10 `gpt-5.4-mini` agents.**

Give each agent:
- the shared taxonomy
- one batch file’s questions
- responsibility for exactly one result file

**Step 3: Wait for results, then save/merge them.**

Each result must contain one record per input question:
- `questionId`
- `sectionId`
- `officialSubtopic`

### Task 3: Validate and merge classifications into the source override file

**Files:**
- Create: `scripts/merge_question_recategorizations.py`
- Modify: `data/question_taxonomy_overrides.json`

**Step 1: Write a merge/validation script.**

It should:
- load all batch results
- validate IDs, sections, and subtopics
- reject duplicates/missing records
- write the canonical merged override file

**Step 2: Run the merge script.**

Run: `python3 scripts/merge_question_recategorizations.py`

Expected:
- merged override file covers every normalized question
- script fails loudly on invalid or incomplete results

### Task 4: Update the build pipeline to use explicit overrides

**Files:**
- Modify: `scripts/build_fe_industrial_data.py`
- Modify: `data/fe_industrial_blueprint.json`

**Step 1: Update blueprint labels to the new naming where needed.**

Align displayed topic/subtopic names with the user-provided taxonomy.

**Step 2: Load explicit per-question overrides in the build script.**

When a question ID exists in the override file, use its `sectionId` and `officialSubtopic`. Otherwise fall back to existing rule-based matching.

**Step 3: Rebuild generated outputs.**

Run: `python3 scripts/build_fe_industrial_data.py`

Expected:
- `data/normalized-question-bank.json` updated with explicit assignments
- `data/app-data.js` regenerated successfully

### Task 5: Verify output integrity

**Files:**
- Inspect: `data/normalized-question-bank.json`
- Inspect: `data/app-data.js`
- Inspect: `data/coverage_report.json`

**Step 1: Confirm every normalized question has a valid updated assignment.**

Run a script or command that verifies:
- all section IDs exist in blueprint
- all subtopics belong to their section
- total question count remains unchanged

**Step 2: Run the app build sanity check.**

Run: `npx -y esbuild app.jsx --bundle --format=iife --outfile=/tmp/festudy-recategorized.js`

Expected:
- build succeeds

**Step 3: Summarize any anomalies for manual review.**

Examples:
- lopsided section counts
- suspicious source-topic-to-section migrations
- validation warnings
