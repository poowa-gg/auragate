---
inclusion: always
---

# AuraGate Architecture & Engineering Guardrails

## Domain & Responsibilities

AuraGate is an autonomous legacy-to-modern bridge engine. It translates binary/hex legacy packets (EBCDIC/CP037 and ISO-8583 financial switches) into structured JSON, OpenAPI 3.1 specifications, and verified TypeScript microservices.

**Core translation pipeline:**
- Input: raw binary/hex packets (EBCDIC/CP037 encoding, ISO-8583 financial switch format)
- Output: structured JSON, OpenAPI 3.1 specs, TypeScript microservice stubs

## Runtime & Language

- **Runtime:** Node.js v20+
- **Language:** TypeScript with `strict` mode enabled (`"strict": true` in `tsconfig.json`)
- **No `any` policy:** Every data structure, byte buffer, and parser result must be explicitly typed. Never use `any`, `unknown` without narrowing, or implicit `any`.

## Code Style & Architecture Patterns

### Zero-Copy Byte Parsing
- Decode binary streams using `Buffer` or `Uint8Array` — never string slicing for raw byte offsets.
- Operate on byte ranges via typed views (e.g. `buf.subarray(offset, offset + len)`) rather than converting to strings prematurely.

### Pure Codec Design
- All parsing functions must be **pure and deterministic**.
- Signature contract: `decode(buf: Buffer): Result<T, ParseError>`
- No shared mutable global state in any codec module.
- Encoders must be the inverse of decoders — `encode` and `decode` are a matched pair.

### Project Structure
- `src/core/` — core parsing, codec, and transformation logic
- `src/mcp/` — microservice composition and pipeline orchestration
- `tests/pbt/` — property-based tests (one file per parser module)
- `samples/` — example binary/hex input packets for manual testing

## Testing Requirements

Every parser module **must** have a corresponding property-based test (PBT) in `tests/pbt/` using `fast-check`.

Two invariants are required for all codecs:

1. **Round-trip invariant:** `decode(encode(M))` must deep-equal `M` for any valid structured model `M`.
2. **Fuzz invariant:** Feeding arbitrary random byte streams to any decoder must return a structured `ParseError` — it must **never** throw an uncaught exception.

> When adding a new parser, always add the matching PBT file in `tests/pbt/` before considering the feature complete.

## Error Handling

- Decoders never throw — all failure paths return a typed `ParseError` result.
- Use a discriminated union `Result<T, ParseError>` pattern (or equivalent) for all codec return types.
- `ParseError` must carry enough context to identify the byte offset and field name where parsing failed.
