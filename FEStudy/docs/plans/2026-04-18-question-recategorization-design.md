# FE Industrial Question Recategorization Design

## Summary

We are replacing the current mostly rule-based topic/subtopic assignment with an explicit, per-question classification source of truth keyed by question ID. Each question will be assigned exactly one topic (`sectionId`) and one official subtopic from the updated FE Industrial taxonomy supplied by the user.

The recategorization run will be performed in batches using 10 `gpt-5.4-mini` subagents. Each subagent will receive a disjoint slice of the normalized question bank plus the allowed taxonomy and will return one classification per question. The merged output will be validated and then fed into the dataset build pipeline so regenerated app data uses these explicit assignments.

## Goals

- Reclassify all FE Industrial questions to the updated topic and subtopic taxonomy.
- Preserve question identity across reclassification using existing unique question IDs.
- Make future taxonomy edits easy by storing explicit per-question overrides instead of relying only on keyword rules.
- Keep the generated files (`normalized-question-bank.json`, `app-data.js`) reproducible from source files.

## Non-Goals

- Rewriting or deleting the original source question bank.
- Building a manual in-browser recategorization UI.
- Replacing every existing mapping heuristic immediately; heuristics can remain as fallback while explicit overrides take precedence.

## Data Model

Add a new source file in `data/` that stores explicit per-question categorization records. Each record will include:

- `questionId`
- `sectionId`
- `officialSubtopic`

The build script will load this file and apply it whenever a question ID is present. Existing keyword/source-topic mapping logic can remain as a fallback for any uncategorized question, but the intended steady state is full coverage via explicit assignments.

## Workflow

1. Read `data/normalized-question-bank.json` as the stable input list of questions.
2. Split the 915 questions into 10 batches of roughly equal size.
3. For each batch, provide the subagent:
   - the exact allowed topics and subtopics
   - the assigned question slice with IDs, source topic/subtopic, type, stem, and choices
   - instructions to return exactly one allowed `sectionId` and one allowed `officialSubtopic` per question
4. Merge all batch outputs into one classification file.
5. Validate:
   - every source question ID appears exactly once
   - every `sectionId` is valid
   - every `officialSubtopic` belongs to the selected section
6. Update the build pipeline to use explicit assignments first.
7. Rebuild generated data and inspect coverage/output sanity.

## Validation Rules

- No missing question IDs
- No duplicate question IDs
- No invalid section IDs
- No invalid subtopics for a given section
- Total classifications must equal the normalized question count

## Risks And Mitigations

### Risk: borderline questions get inconsistent classifications across batches

Mitigation: all agents receive the same taxonomy and identical output constraints; merged results are schema-validated; any suspicious outliers can be spot-checked after merge.

### Risk: generated data drifts from source files

Mitigation: do not edit generated files directly; rebuild from source classification data using the script.

### Risk: future taxonomy changes require manual churn

Mitigation: storing per-question assignments in a dedicated source file makes later edits targeted and deterministic.
