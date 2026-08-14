# AGENTS.md — instructions for AI coding agents working on this repository

You are implementing **Harness Whale**, an unofficial community pet for
DeepSeek Harness, as a native DSH web plugin (NOT a browser extension).

## Read first

1. `SPEC.md` — the authoritative spec (statuses, UI, settings, privacy, tests,
   acceptance criteria).
2. `RESEARCH.md` — verified reconnaissance of how DeepSeek Harness loads client
   plugins and exposes agent state. **Use these findings instead of re-deriving
   them.** It also lists local paths to the official type definitions.

## Hard constraints

- This is an **unofficial community project**. Keep the disclaimer in README,
  package.json `description`, and UI footer:
  "This is an unofficial community project. Not affiliated with, endorsed by,
  or maintained by DeepSeek."
- **Never modify DeepSeek Harness itself.** Only files inside this repo (plus the
  user's profile install step via `dsh plugin`, which is normal usage).
- **No telemetry, no analytics, no network requests at runtime.** Settings live in
  `localStorage` only. No third-party services.
- **Minimal dependencies.** TypeScript + tsdown + vitest only. Avoid UI frameworks
  unless necessary (React ^18.2.0 matches the host if used).
- **Do not commit, push, or publish.** Leave `git` and `npm publish` to the user.
- **Do not download assets from the internet.** Use the procedural whale renderer;
  sprite assets go in `assets/whale/` with an `ATTRIBUTION.md` entry.
- All Harness-specific detection logic stays in `src/adapters/deepseek-harness.ts`
  with a pure `(SignalSnapshot) → PetStatus` core. Never scatter state detection
  into pet/UI code.
- Respect `prefers-reduced-motion: reduce`.

## Build & test

```sh
pnpm install        # or npm install
pnpm test           # vitest (unit: state machine, adapter, storage, singleton guard)
pnpm run typecheck  # tsc --noEmit
pnpm bundle         # tsdown → lib/client.js (+ node half if any)
```

## Dev loop (on the user's machine)

- Install into the live profile from the repo's parent directory:
  `dsh plugin --profile web add link:../harness-whale`
- After changing installation (add/remove plugins), the `dsh web` process must be
  restarted. Code-only rebuilds just need a page refresh.
- Verify in the browser console: `window.__DSH_BOOT__.entries` contains
  `harness-whale`; `fetch('/plugins/harness-whale/client.js')` returns 200.

## Honesty rules

- If a pet state cannot be reliably detected, say so in the final report — do not
  fake it. `success` is derived from `running: true→false` without error; document
  it as such.
- Distinguish automated verification from items that require manual testing.

## Final report format (SPEC §12)

1. Which mechanism Harness uses for agent-status detection.
2. List of new files.
3. Install/load instructions (npm, git, link).
4. Verification results (automated vs. manual).
5. States that cannot be reliably identified (explicitly, without fabrication).
6. Nothing committed/pushed/published — pending user review.
