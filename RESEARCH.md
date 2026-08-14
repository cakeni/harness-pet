# Harness Whale — Reconnaissance Findings (RESEARCH)

Pre-implementation research on how DeepSeek Harness works, so the implementer does
not need to re-derive it. **All findings below were verified against the actually
running Harness instance (`http://127.0.0.1:3080`) and the installed npm packages.
Nothing in DeepSeek Harness was modified; bundles were downloaded read-only.**

Harness version observed: `@deepseek-ai/dsh` **0.1.0-rc.6** (all `@deepseek-ai/dsh-*`
packages share this version).

## 1. Web page anatomy

- The web GUI is a Vite app with `<div id="root">`.
- Before any app code runs, the server injects `window.__DSH_BOOT__`:
  `{ rev, entries: [{ id, url, rev, inject: [...], immediately? }] }`.
  Every client plugin is an entry there, e.g.
  `@deepseek-ai/dsh-client-connection`, `@deepseek-ai/dsh-client-ui-tool`, etc.
- Each client plugin bundle follows this exact pattern:

  ```js
  window.__ModuleLoader__.load({
    id: "@deepseek-ai/dsh-client-ui-plan",
    factory: (require) => {
      // ... plugin body, importing via require("react"), require("...")
      exports.apply = apply;
      exports.inject = inject;   // string[] service paths
      return module.exports;
    }
  });
  ```

- `apply(ctx)` receives the Cordis client root context. Services listed in the
  plugin's `inject` are resolved onto `ctx` (e.g. `ctx.slots`, `ctx.locale`,
  `ctx.remote.commands`, `ctx.sessions`).
- CSS modules are injected as `<style data-plugin-css="...">` tags and cleaned up
  with the plugin lifecycle.

## 2. How a third-party plugin registers (the template)

A plugin package (`harness-whale`) needs:

1. `package.json`:
   - `"dsh": { "bundle": { "patch": "./cordis.patch.yml" }, "client": { "inject": [...], "platform": "web" } }`
   - `exports["./client"]` → `lib/client.js`
   - `peerDependencies` on the `@deepseek-ai/dsh-*` packages it consumes
     (react `^18.2.0` if used).
2. `cordis.patch.yml`: a loader patch inserting one host row:
   `- insert: [ { id: whale-pet, name: 'harness-whale' } ]`.
   The `dsh-web-app` bundle patch documents this: "`dsh.client` rows are the
   browser roster the modules node half scans into `window.__DSH_BOOT__`".
3. Install: `dsh plugin --profile web add harness-whale` (npm) or
   `dsh plugin --profile web add github:cakeni/harness-whale` (git) or
   `dsh plugin --profile web add link:../harness-whale` (dev).

Template references (readable examples in the local npm checkout, see §6):
`@deepseek-ai/dsh-client-ui-plan` (smallest client plugin: package.json shape,
`apply`/`inject`, slot registration) and `@deepseek-ai/dsh-cordis-client-runner`
(runtime engine docs).

## 3. Official client state sources (what the pet should subscribe to)

All in `@deepseek-ai/dsh-client-runtime`'s client types (§6 paths):

- **`ConversationSnapshot`** (per current session, via `ctx.sessions`):
  - `partial: PartialAssistant | null` — in-flight streamed output
    (`{ turn, step, blocks: AssistantBlock[] }`; block kinds: `text`, `reasoning`,
    `tool-call`, `image`, `other`).
  - `running: boolean` — a turn is executing.
  - `runningCalls: RunningToolCall[]` — in-flight tool calls, each with a
    **structured `name`** (`{ callId, name, argsRaw, turn, step, time, callView, subCalls }`).
  - `pending: PendingInteraction[]` — pending interactions (user questions /
    approvals) → maps to `waiting`.
  - `queue: QueuedMessage[]` — `placement: 'queued' | 'steering' | 'context'`.
  - `promptError: { op: 'send' | 'stop', error: RpcError } | null`.
  - `lastAgentError: string | null`.
  - `nodes: ConversationNode[]` — finalized nodes; `kind: 'turn-error'` exists
    (with `message`, `code`), plus `tool-result` nodes with `isError`, `call.name`.
  - `openState: 'cold' | 'loading' | 'open' | 'error'`, `removed`, `blank`,
    `composerPhase: 'blank' | 'engaging' | 'active'`.
- **`ToolCallTree`** — recursive parent/child pairing for tool calls
  (`projectRunningCalls`, `apply(SessionEvent)`).
- **`ConnectionState`** (`@deepseek-ai/dsh-client-connection`):
  `'connected' | 'reconnecting'`; sinks: `onStateChange`, `onConnected`.
  Transport is fetch + **WebSocket downlink** (`websocket-downlink.d.ts`).
- **Host projections** (push model, `session/projection` frames): known keys
  include `plan`, `goal`, `todos`, `contextPressure`, `sessionStats`, `title`.
  Read via `useProjection(key)` hook or `projections.faceOf(key)`. The pet does
  not strictly need projections; snapshots cover all pet states.

## 4. Recommended state mapping (spec §3)

| PetStatus | Signal (structured, NOT text matching) |
|---|---|
| idle | default when nothing below matches |
| thinking | `snapshot.partial !== null` and no running tool call |
| working | `snapshot.running === true` or `runningCalls.length > 0` (generic tools) |
| searching | any running call `name` ∈ `web_search`, `tool_web` (verify exact names at runtime) |
| bash | any running call `name` ∈ `bash`, `tool_bash`, `pwsh`, `tool_pwsh` |
| editing | any running call `name` ∈ `str-replace-editor`, file-write tools |
| waiting | `snapshot.pending.length > 0` or queue has `placement === 'queued'` |
| error | `promptError` / `turn-error` node / `lastAgentError` / connection `reconnecting` |
| success | derived: observed `running: true → false` with no error; short (~3 s) celebration, then idle |

Priority: error > success > waiting > searching/bash/editing > working > thinking > idle.
All tool-name→state mapping lives in ONE table inside the adapter (easy to extend).

## 5. `dsh plugin` CLI mechanics (verified from `@deepseek-ai/dsh/lib/plugin-*.js`)

- `dsh plugin --profile <name> <pnpm args>` initializes the profile on first use
  (`$DSH_HOME/profiles/<name>/package.json`), then forwards args to **pnpm** with
  cwd = profile dir.
- After a successful pnpm run, it **reconciles** `dsh.profile.bundles`: any
  installed dependency whose package declares `dsh.bundle.patch` joins the bundle
  list automatically; removals drop out. → `harness-whale` must declare
  `dsh.bundle.patch` to become an active layer.
- Relative path specs (`.`, `../x`, `file:`, `link:`) are anchored to the
  invoking directory — so `dsh plugin --profile web add link:../harness-whale`
  run from the project parent works as expected.
- Git-hosted deps with a `prepare` build script are blocked by pnpm until the
  profile's `pnpm-workspace.yaml` adds the exact key under `allowBuilds`; the CLI
  prints the key. README must mention this for the git install path.
- `pnpm` must be on PATH (`dsh plugin` exits 127 otherwise).
- Local profiles normally live under `$DSH_HOME/profiles/<profile>` (for
  example `$DSH_HOME/profiles/web`).

## 6. Official reference materials used for implementation

The adapter was implemented against the official client API type definitions
from the installed `@deepseek-ai/dsh-*` packages. A development workspace may
carry read-only copies under `research/reference/` and live bundles under
`research/bundles/`, but both directories are excluded from the public repository
and published package. They can be regenerated from the locally installed DSH
dependencies when compatibility needs to be re-verified:

```
research/
  reference/                  # official type definitions (read these first)
    dsh-client-runtime/lib/types/client/sessions/conversation.d.ts   # ConversationSnapshot
    dsh-client-runtime/lib/types/client/sessions/tool-call-tree.d.ts # RunningToolCall tree
    dsh-client-runtime/lib/types/client/sessions/session.d.ts        # Session/projections face
    dsh-client-runtime/lib/types/client/sessions/pending.d.ts        # PendingInteraction (waiting)
    dsh-client-runtime/lib/types/client/contract/session.d.ts        # service contract
    dsh-client-connection/lib/types/client/connection.d.ts           # ConnectionState
    dsh-cordis-client-runner/lib/types/client/runtime.d.ts           # loader/apply/inject docs
    dsh-client-ui-slots/lib/types/renderer.d.ts                      # slot registry + renderer
    dsh-web-app/cordis.patch.yml                                     # dsh.client roster mechanics
    dsh-client-ui-plan/package.json + lib/types/client/index.d.ts    # smallest plugin template
    dsh-session-projection/lib/types/  ...                           # projection type table
  bundles/                     # downloaded live client.js bundles (15 files;
                               # grep for real class names/behavior; DO NOT commit)
```

The original npm checkout and raw bundle downloads live outside this workspace
and are not needed to build or test the plugin.

## 7. Verification procedure (after the plugin builds)

1. `dsh plugin --profile web add link:../harness-whale` (from the repo parent).
2. **Restart the `dsh web` process** (install changes require a host restart to
   re-scan the plugin roster; code-only rebuilds just need a page refresh).
3. Reload `http://127.0.0.1:3080`, then in DevTools:
   - `window.__DSH_BOOT__.entries` includes `harness-whale`;
   - `fetch('/plugins/harness-whale/client.js')` → 200;
   - pet renders bottom-right; console shows no errors.
4. Dev loop: `pnpm bundle` → refresh page (link install serves `lib/client.js`
   from the linked source dir, so rebuild + refresh is sufficient).

## 8. Caveats & risks

- **Pre-1.0 API**: everything is `0.1.0-rc.6`; client plugin API is not frozen.
  Keep ALL harness coupling inside `src/adapters/deepseek-harness.ts`, and pin
  peerDependencies with `^0.1.0-rc.6`. Document the compatibility matrix in README.
- **`success` is derived**, not a native signal (§4). Don't claim otherwise.
- **Never match UI text**: the UI is i18n'd (zh/en); use structured fields only.
- The pet should create its own floating root (high z-index, bottom-right,
  clamped to viewport) rather than relying on a specific slot seat; using the
  slot system is optional.
- npm name `harness-whale` was available at research time; GitHub username from
  local git config is `cakeni` (verify with the user).
