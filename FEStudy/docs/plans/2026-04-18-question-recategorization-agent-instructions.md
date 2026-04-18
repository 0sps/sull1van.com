# Question Recategorization Agent Instructions

Each agent receives one batch JSON file from `data/recategorization_batches/`.

## Task

For every question in the batch, assign exactly:

- one `sectionId`
- one `officialSubtopic`

Both values must come from the `allowedSections` taxonomy embedded in the batch file.

## Rules

- Read the question stem carefully.
- Use answer choices when they help disambiguate the subject.
- Return the closest best-fit classification even if the fit is imperfect.
- Do not skip questions.
- Do not invent new section IDs or subtopics.
- Do not return explanations in the JSON output file.

## Output Format

Return a JSON array only:

```json
[
  {
    "questionId": "example-question-id",
    "sectionId": "engineering-economics",
    "officialSubtopic": "Discounted cash flows"
  }
]
```

## Quality Bar

- Every input question must appear exactly once in the output.
- `officialSubtopic` must belong to the chosen `sectionId`.
- Prefer conceptual fit over matching the old source topic name.
