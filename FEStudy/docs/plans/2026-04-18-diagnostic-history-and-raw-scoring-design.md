# Diagnostic History And Raw Scoring Design

## Summary

This change separates two concepts that were previously mixed together:

1. Readiness scoring on topic and subtopic cards
2. Diagnostic test history and behavior

Topic and subtopic progress bars should be driven by the user's latest saved per-question outcomes in browser memory. Diagnostics should become a separate history feature that can be retaken any number of times, exported, and reviewed over time without redefining the meaning of the dashboard bars.

## Goals

- Replace confidence-adjusted topic and subtopic scoring with simple raw percent correct.
- Gate topic-level percentages until the user has answered at least 10 questions in that topic.
- Gate subtopic percentages until the user has answered at least 1 question in that subtopic.
- Grey out topic and subtopic progress bars when there is too little data.
- Show the topic-bar message `ANSWER AT LEAST 10 QUESTIONS TO SEE` inside the inactive topic bar.
- Allow unlimited diagnostic attempts and store them separately in browser memory and exported JSON.
- Make diagnostic tests pull balanced coverage across topics, based on a user-selected "questions per topic" target.
- Prevent diagnostic sessions from revealing prior-answer state, while regular quizzes and reviews continue to show prior-answer context.
- Keep the newest graded result authoritative in the main per-question progress store for both diagnostics and other quiz types.

## Non-Goals

- Do not build a full attempt-by-attempt answer log for every question forever.
- Do not preserve old right/wrong states once a newer graded result replaces them in the main question store.
- Do not overhaul the non-diagnostic topic/subtopic quiz setup flow beyond what is needed to preserve prior-answer visibility there.

## Current Problems

The current dashboard uses a confidence-adjusted estimate based on answered and correct counts. That creates a fuzzy mental model for users because the card percentage is not simply "how often am I getting this topic right?"

Diagnostics are also currently treated like another saved quiz session with the same generic setup flow and the same baseline handling. That makes it hard to support repeated diagnostics, historical comparison, and the requirement that diagnostics should feel fresh even when they recycle previously answered questions.

## Recommended Approach

Keep the existing latest-result memory model for practice progress and layer a dedicated `diagnosticAttempts` history store alongside it.

The dashboard bars will be driven only by cumulative `questionResults`, using raw percent correct and the new visibility thresholds. Diagnostic attempts will be stored separately as their own records and exported/imported alongside normal progress.

Diagnostics will use a dedicated setup dialog where the user chooses the target number of questions per topic. The app will estimate the resulting total question count using actual available question pools, preferring unanswered questions first and then previously answered questions within each topic.

## Scoring Rules

### Topic cards

- Topic percentage = `Math.round((correct / answered) * 100)` when `answered >= 10`
- Topic bar is greyed out when `answered < 10`
- Inactive topic bars should display the message `ANSWER AT LEAST 10 QUESTIONS TO SEE`
- The old `x% ready` framing should be replaced with `% correct`

### Subtopic rows

- Subtopic percentage = `Math.round((correct / answered) * 100)` when `answered >= 1`
- Subtopic bar is greyed out when `answered === 0`
- Inactive subtopic bars show no extra message
- Subtopic labels should also use `% correct` instead of readiness wording

### Authoritative answer state

For both diagnostics and non-diagnostic quizzes, the newest graded result for a question replaces the previous saved result in the main `questionResults` store. If a question was previously marked wrong and is later marked right, the stored result becomes right.

## Diagnostic Setup And Selection

Diagnostics should no longer use the generic correct/incorrect/unanswered mix dialog.

Instead, `Take diagnostic` and `Retake diagnostic` will open a diagnostic-specific setup dialog with:

- a numeric input for `questions per topic`
- a computed estimated total question count
- supporting copy that explains the pull order

Selection rules:

- For each topic, try to pull up to the requested number of questions
- Prefer unanswered questions from that topic first
- If unanswered questions run out, use previously answered questions from that topic
- If the topic is exhausted, contribute fewer than requested
- Shuffle the final combined question list before the session starts

The estimated total should be based on the current question bank and current user progress, not a naive `topic count × requested count` calculation.

## Diagnostic Session Behavior

Diagnostics should suppress prior-answer display even when a question has been seen before.

That means:

- No prior-answer state should be surfaced inside the diagnostic quiz UI
- Diagnostic questions should still grade normally
- Once graded, the new result should still overwrite the authoritative saved result in `questionResults`

Regular topic tests, subtopic tests, and reviews should continue to show prior-answer context in the main quiz/test UI where applicable.

The cleanest implementation is to make prior-answer visibility explicit in session state, rather than implicitly tying it to whether a baseline result exists. Diagnostics can set `showPriorResults: false`, while other applicable quiz modes can set it to `true`.

## Data Model Changes

### Progress storage

Extend browser progress storage with:

- `diagnosticAttempts: []`

Each diagnostic attempt should include:

- `id`
- `startedAt`
- `completedAt`
- `questionsPerTopic`
- `questionIds`
- `responses` or equivalent per-question graded results
- per-topic summary counts for that attempt
- overall answered/correct totals for that attempt

The existing `questionResults` object remains the single authoritative latest-result map for dashboard scoring and answer history.

### Import/export

Extend the exported JSON schema to include `diagnosticAttempts`.

Import rules:

- Old exports that do not contain `diagnosticAttempts` should still import cleanly
- Missing diagnostic history should normalize to an empty array
- Existing active quizzes should still restore as before

## UI Changes

### Dashboard

- Replace readiness wording with `% correct`
- Render inactive topic bars when the answered count is below 10
- Render inactive subtopic bars when the answered count is 0
- Keep mapped-question and answered/right-wrong summary text visible even when bars are inactive

### Diagnostic controls

- `Take diagnostic` opens the diagnostic setup dialog
- The dialog includes the `questions per topic` input and the estimated total

### Diagnostic history

Add a lightweight diagnostic history panel on the dashboard that shows past attempts with at least:

- completion date/time
- questions per topic
- total graded count
- overall percent correct

The first pass does not need a full attempt-detail drill-in view unless implementation is trivial.

## Error Handling And Compatibility

- If a diagnostic target would produce zero questions, the start button should remain disabled.
- If some topics have no remaining mapped questions, the estimate and final test should simply be smaller.
- Old saved progress should normalize into the new schema without breaking existing users.
- Saved active quizzes should continue to restore after import and reload.

## Testing Strategy

- Verify topic score calculation shows raw percent only at 10+ answered questions.
- Verify topic bars stay greyed out below 10 answered and render the required message.
- Verify subtopic bars stay greyed out at 0 answered and activate at 1+ answered.
- Verify diagnostics can be taken repeatedly and create separate stored attempts.
- Verify diagnostic setup estimate changes as the requested questions-per-topic value changes.
- Verify diagnostics prefer unanswered questions first, then previously answered questions.
- Verify diagnostics do not reveal prior-answer state inside the quiz UI.
- Verify regular topic/subtopic tests still do show prior-answer context where they currently do.
- Verify grading a recycled question updates the authoritative `questionResults` value.
- Verify export/import round-trips diagnostic history without breaking older export formats.
