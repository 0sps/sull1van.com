# Topic Detail Modal Design

**Date:** 2026-04-18

## Summary

Replace the current full-page topic detail route with a modal overlay that opens from the dashboard. The modal should contain the same topic-level and subtopic-level actions that the page currently exposes, while preserving the existing quiz and review flows and making it easy to return to the same topic modal after leaving a quiz session.

## Goals

- Open topic details without navigating away from the dashboard.
- Preserve all current topic-detail capabilities inside the modal.
- Keep the existing quiz setup, review, and saved-session dialogs working on top of the topic modal.
- Return the user to the same topic modal when they leave or submit a quiz launched from that modal.
- Maintain the current dashboard and quiz behavior everywhere else.

## Non-Goals

- Introduce a general-purpose routing system.
- Redesign the topic detail content itself beyond the minimal modal framing needed.
- Convert quiz sessions into modals.

## Current Constraints

- App-level state lives in `app.jsx`.
- The current topic detail flow depends on `view = { name: "topic", sectionId }`.
- Quiz session exit currently infers its return target from `activeQuiz.sectionId`.
- The app already has reusable dialog/backdrop patterns for resets, quiz actions, and test setup.

## Proposed UX

### Topic Modal

- Clicking `Open topic` opens a modal overlay above the dashboard.
- The dashboard remains visible but dimmed behind the modal.
- The modal has a close control, closes on backdrop click, and closes on `Escape`.
- The modal body contains the existing topic detail content: section title, mapped-question summary, score, resume/review actions, topic test CTA, subtopic list, and subtopic test CTAs.

### Layering

- The topic modal sits above the dashboard content.
- Existing dialogs such as test setup and leave/submit quiz dialogs continue to render above the topic modal.
- Entering a quiz session hides the dashboard and modal and shows the existing quiz session view.

### Return Flow

- If a quiz is launched from the dashboard, leaving or submitting the quiz returns to the dashboard.
- If a quiz is launched from the topic modal, leaving or submitting the quiz reopens that same topic modal.
- Resume quiz from inside the topic modal should preserve that same return target.

## Proposed State Model

- Replace page-level topic navigation with a dedicated `topicModalSectionId` state in `App`.
- Keep `view` focused on high-level app modes such as `dashboard` and `session`.
- Add explicit helper functions for opening and closing the topic modal.
- Extend quiz session metadata with a `returnTarget` field so quiz back-navigation does not depend on inferred view state.

## Component Approach

- Reuse `TopicDetail` as the modal content source of truth.
- Wrap `TopicDetail` in a new modal shell rendered from `App`.
- Give `TopicDetail` a close-oriented callback instead of a page-navigation callback.
- Keep `Dashboard` simple by changing `onOpenTopic` to open the modal state.

## Risks

- Quiz back-navigation can regress if any launch path forgets to set the new return target.
- Stacked overlays need careful z-index ordering so test setup and confirm dialogs remain usable.
- The modal needs responsive sizing and internal scrolling for long subtopic lists.

## Validation

- Open and close a topic modal from the dashboard via button, backdrop, and `Escape`.
- Start topic practice, subtopic practice, review, and resume flows from within the modal.
- Leave or submit those sessions and confirm the same topic modal is restored.
- Confirm dashboard-only launches still return to the dashboard.
- Confirm reset/test-setup/quiz-action dialogs still appear correctly above the topic modal.
