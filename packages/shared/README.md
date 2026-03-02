# shared

Canonical types used by both backend and frontend. Single source of truth; no duplicates in other packages.

## Type decisions (canonical)

- **JWTHeader.alg** — required (`alg: string`). Every JWT has an alg.
- **JWTRisk.type** — required.
- **JWTRisk.impact** — required.
- **Finding.metadata.issuer** — optional. Not every JWT has `iss`.
- **CapturedResponse** — standalone type; not inlined in CapturedRequest.
- **Result&lt;T&gt;** — discriminated union `{ kind: "Ok"; value: T } | { kind: "Error"; error: string }` for API boundaries.

## Usage

Backend and frontend depend on `"shared": "workspace:*"` and import with `import type { ... } from "shared"`.
