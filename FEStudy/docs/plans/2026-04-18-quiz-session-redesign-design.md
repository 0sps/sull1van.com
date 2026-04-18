# Quiz Session Redesign Design

**Date:** 2026-04-18

## Summary

Redesign the in-quiz experience so the question-taking workflow stays inside the browser viewport, avoids layout jumps after grading, and supports revisiting prior questions. Persist quiz state in local storage so progress survives navigation away from the session and can be resumed later. Only one saved quiz session should exist at a time; starting a new quiz replaces the old one.

## Goals

- Keep quiz controls visible without requiring page scroll after each answer.
- Make the question itself the visual center of the experience.
- Allow jumping to previous and future questions within the same quiz.
- Allow changing a question's right/wrong mark after revisiting it.
- Save quiz progress immediately so exiting mid-quiz does not lose work.
- Distinguish an in-progress quiz from a completed quiz.
- Let the user resume an in-progress quiz from the dashboard or topic flow.

## Non-Goals

- Support multiple concurrent saved quizzes.
- Introduce server-side storage or accounts.
- Build a timed exam simulation.

## Current Constraints

- The app is a static React 18 app loaded directly from `index.html`.
- Most application state lives in `app.jsx` and is persisted in `localStorage`.
- Progress tracking is currently append-only per answered question and does not support reversing a prior mark.
- The current session layout expands vertically when the answer panel appears, forcing scroll on typical laptop displays.

## Proposed UX

### Session Shell

Quiz sessions should render inside a dedicated viewport-height shell instead of the normal dashboard content layout. The shell should include:

- A compact header with the mode label, quiz title, question count, progress, and exit control.
- A centered question card sized to fit within the remaining viewport.
- A persistent navigator showing all question numbers and their answer states.
- A bottom action area that remains visible and does not move when the answer is revealed.

The question card may internally scroll for unusually long content, but the page itself should not require vertical scrolling during normal quiz interaction.

### Question Flow

- Selecting an answer reveals the grading/result state inside the existing card footprint instead of pushing content lower on the page.
- Open-ended questions show the self-grade controls in the persistent action area.
- Users can move between questions using next/previous controls and by clicking navigator chips.
- Users can revisit any question and change their mark from correct to incorrect or vice versa.

### Session Lifecycle

- Starting a quiz creates a saved active session with status `in-progress`.
- Leaving the quiz keeps the saved session intact.
- Returning later offers a resume action if an in-progress session exists.
- Submitting the quiz marks the saved session as `complete`.
- Starting any new quiz replaces the previous saved session, whether in-progress or complete.

## Proposed Data Model

Add a second local storage record for the active quiz session. Store:

- Session metadata: `mode`, `title`, `subtitle`, `sectionId`, `officialSubtopic`
- Lifecycle fields: `status`, `startedAt`, `completedAt`, `lastUpdated`
- Navigation state: `currentIndex`
- Question ordering: array of question ids
- Per-question responses keyed by question id:
  - selected choice
  - revealed state
  - graded result (`correct`, `incorrect`, or null)

Progress should no longer depend on append-only updates. Instead, aggregate the saved question results from the completed and in-progress session state and update topic/subtopic counters in a reversible way whenever a question mark changes.

## Progress Semantics

- Marking a question correct increments the related section/subtopic counts.
- Changing a prior mark removes the previous contribution before applying the new one.
- Unmarking a question removes its contribution.
- Exiting the quiz does not change saved progress because updates already happened immediately.
- Submitting the quiz finalizes the session state but does not need a second pass over progress.

## Dashboard and Topic Entry Points

- When a saved session has status `in-progress`, show a `Resume quiz` action from the dashboard and topic areas if it matches the current context.
- Starting a new diagnostic or topic test replaces the saved active session.
- Regular non-test practice can continue to use the existing flow unless the new session shell is generalized to all session modes during implementation.

## Risks

- Reworking progress updates from append-only to reversible updates touches central state logic.
- Question identifiers and session question ordering must stay stable across resume events.
- The new shell must handle long MathJax content without clipping critical controls.

## Validation

- Start a quiz, answer a few questions, leave, and resume at the same question with prior markings intact.
- Change a prior answer from correct to incorrect and verify section/subtopic progress updates immediately.
- Submit a quiz and verify it is marked complete.
- Start a new quiz and verify the old saved session is replaced.
- Confirm no page-level scrolling is needed to answer and navigate on a typical laptop viewport.
