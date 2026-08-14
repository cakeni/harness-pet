# Changelog

## Unreleased

- Added a close control for the conversation card, a **Show Dialog** recovery action in settings, and per-session dismissal behavior.
- Made the settings panel independently draggable by its title bar, with viewport clamping and small-window scrolling.
- Added a persisted interface language selector with English as the default plus Simplified Chinese, Japanese, and Korean translations.
- Prevented the settings panel from jumping while the pet-size slider changes, and clarified the independent floating-pet action for minimized Harness windows.
- Made long streamed replies follow their latest output in the dialog, and added the official `chat.legacy` signal mirror as a compatibility fallback.
- Renamed the user-facing brand to Harness Pet and replaced the old 4×4 artwork with a transparent 6×9 atlas containing six dedicated frames for each of the nine states.
- Rebuilt the animation with the open-source `hatch-pet` fixed-cell pipeline: 8×9 atlas, deterministic frame extraction, left/right drag rows, motion previews, and zero-error transparency/geometry validation.
- Enriched semantic state motion with a connected water-spout success loop, a flipper-held magnifier search loop, and a red-hot fault/error loop while retaining fixed-cell QA guarantees.

All notable changes to Harness Pet will be documented here.

## [Unreleased]

- Add the native DSH client bundle and profile patch.
- Add structured Harness signal detection for nine pet states.
- Add a procedural Canvas whale, drag persistence, settings, debug controls,
  reduced-motion support, and complete lifecycle cleanup.
- Add unit tests, CI, bilingual documentation, and privacy/compatibility notes.
- Add a Codex Pet-style local prompt/status card and a contained click interaction.
- Expand the whale artwork to a 6×9 atlas with dedicated rows for all nine states.
- Isolate every sprite frame with transparent gutters, soften the idle expression, and mirror the whale with drag direction.
- Show live/final Harness reply text in the card and add an explicit follow-up input backed by the official current-session prompt queue.
- Add an optional Chromium Document Picture-in-Picture desktop window so the pet remains visible while the main Harness window is minimized.
