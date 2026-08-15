# Changelog

All notable changes to Harness Pet are documented here.

## [Unreleased]

- Fixed the floating pet window on Electron-based hosts (e.g. DSH Desktop): Electron does not implement Document Picture-in-Picture (electron/electron#39633), and hosts that deny new windows make `requestWindow()` reject with "Internal error: no window". The feature is now detected as unsupported in Electron and known rejections map to a friendly message in all four languages instead of raw engine text.

## [0.1.0] - 2026-08-14

- Added a close control for the conversation card, a **Show Dialog** recovery action in settings, and per-session dismissal behavior.
- Made the settings panel independently draggable by its title bar, with viewport clamping and small-window scrolling.
- Added a persisted interface language selector with English as the default plus Simplified Chinese, Japanese, and Korean translations.
- Prevented the settings panel from jumping while the pet-size slider changes, and clarified the independent floating-pet action for minimized Harness windows.
- Made long streamed replies follow their latest output in the dialog, and added the official `chat.legacy` signal mirror as a compatibility fallback.
- Renamed the user-facing brand to Harness Pet and replaced the old 4×4 artwork with a transparent 6×9 atlas containing six dedicated frames for each of the nine states.
- Rebuilt the animation with the open-source `hatch-pet` fixed-cell pipeline: 8×9 atlas, deterministic frame extraction, left/right drag rows, motion previews, and zero-error transparency/geometry validation.
- Enriched semantic state motion with a connected water-spout success loop, a flipper-held magnifier search loop, and a red-hot fault/error loop while retaining fixed-cell QA guarantees.
- Added the native DSH client bundle and profile patch, structured nine-state detection, local-only settings, reduced-motion support, and complete lifecycle cleanup.
- Added unit tests, GitHub Actions CI, bilingual documentation, privacy and compatibility notes, and an optional Chromium Document Picture-in-Picture pet window.
