# Requirements Document

## Introduction

AuraGate is an autonomous legacy-to-modern bridge engine that translates binary and hex legacy packets into structured JSON, OpenAPI 3.1 specifications, and verified TypeScript microservices. This document defines the requirements for the core wire de-serialization and synthesis pipeline — the foundational layer that all higher-level AuraGate features are built upon.

The pipeline must handle two primary legacy wire formats: EBCDIC/CP037-encoded mainframe data (including packed-decimal COMP-3 fields) and ISO-8583 financial switch messages. All parsing must be safe, deterministic, and composable, producing typed results rather than throwing exceptions.

## Requirements

### 1. Project Environment

1.1 The project must be configured with TypeScript strict mode enabled (`"strict": true`) and target ES2022 with NodeNext module resolution.

1.2 The following runtime dependencies must be present: `fast-check` for property-based testing and `@types/node` for Node.js type definitions.

1.3 All source files must reside under `src/` with core codec logic in `src/core/` and MCP orchestration in `src/mcp/`.

### 2. EBCDIC / CP037 Codec

2.1 The codec must implement a complete CP037-to-UTF-8 byte conversion table covering all 256 code points.

2.2 The codec must expose a `decode(buf: Buffer): Result<string, ParseError>` function that converts a CP037-encoded byte buffer to a UTF-8 string without throwing.

2.3 The codec must expose an `encode(str: string): Result<Buffer, ParseError>` function that is the exact inverse of `decode`, satisfying the round-trip invariant.

2.4 The codec must support packed-decimal COMP-3 decoding, handling signed nibbles `0xC` (positive), `0xD` (negative), and `0xF` (unsigned).

2.5 Feeding arbitrary random byte sequences to the decoder must never throw an uncaught exception — all failure paths must return a typed `ParseError`.

### 3. ISO-8583 Bitmap Unpacker

3.1 The unpacker must support both primary (64-bit) and secondary (128-bit) bitmap layouts.

3.2 Bitmap parsing must use zero-copy byte operations via `Buffer.subarray` — no premature string conversion of raw byte offsets.

3.3 The unpacker must expose field slicers for both fixed-length and variable-length (LLVAR/LLLVAR) ISO-8583 fields.

3.4 The unpacker must return a typed `ParseError` carrying the byte offset and field name when a field boundary exceeds the buffer length.

3.5 Feeding arbitrary byte sequences to the unpacker must never throw an uncaught exception.

### 4. Property-Based Test Suites

4.1 Every codec module must have a corresponding property-based test file in `tests/pbt/` using `fast-check`.

4.2 Each test suite must verify the **round-trip invariant**: `decode(encode(M))` deep-equals `M` for any valid model `M`.

4.3 Each test suite must verify the **fuzz invariant**: arbitrary random byte arrays fed to any decoder return a structured `ParseError` and never throw.

4.4 Each property check must run a minimum of 1000 iterations.

### 5. OpenAPI 3.1 Schema Synthesizer

5.1 The synthesizer must accept an unpacked wire model and produce a valid OpenAPI 3.1 specification as a structured JSON object.

5.2 Every field extracted from a wire packet must map to a corresponding OpenAPI schema property with an appropriate type and description.

5.3 The synthesizer must be a pure function with no shared mutable state.

### 6. MCP Server

6.1 The MCP server must expose an `inspect_wire_stream` tool that accepts a raw hex or binary payload and returns the decoded structured JSON.

6.2 The MCP server must expose a `synthesize_microservice` tool that accepts a decoded wire model and returns an OpenAPI 3.1 specification.

6.3 The server must be implemented in `src/mcp/server.ts` and must not import mutable global state from codec modules.

### 7. Error Handling

7.1 All decoders must return a discriminated union `Result<T, ParseError>` — never throw.

7.2 `ParseError` must carry at minimum: the byte offset where parsing failed and the field name being parsed at the time of failure.

7.3 No codec or synthesizer function may use `any` or unnarrowed `unknown` in its type signature or implementation.

## Glossary

| Term | Definition |
|------|------------|
| **EBCDIC** | Extended Binary Coded Decimal Interchange Code — a character encoding used on IBM mainframe systems. |
| **CP037** | IBM Code Page 037, the most common EBCDIC variant used in North American mainframe applications. |
| **COMP-3** | IBM packed-decimal format that stores two decimal digits per byte, with the final nibble indicating sign. |
| **ISO-8583** | International standard for financial transaction card-originated messages, used by payment switches. |
| **Bitmap** | A 64- or 128-bit field in an ISO-8583 message where each set bit indicates the presence of the corresponding data element. |
| **LLVAR** | ISO-8583 variable-length field prefixed with a 2-digit decimal length indicator. |
| **LLLVAR** | ISO-8583 variable-length field prefixed with a 3-digit decimal length indicator. |
| **Result\<T, E\>** | A discriminated union type representing either a successful value `T` or a typed error `E`, used to avoid thrown exceptions. |
| **PBT** | Property-Based Testing — a testing approach that verifies invariants hold across a large random sample of inputs. |
| **MCP** | Model Context Protocol — the server interface through which AuraGate exposes its pipeline tools. |
| **OpenAPI 3.1** | The OpenAPI Specification version 3.1, used to describe REST APIs in a machine-readable JSON/YAML format. |
| **Zero-copy** | A parsing strategy that operates on byte ranges via typed views (`subarray`) without allocating intermediate string copies. |
