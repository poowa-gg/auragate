# ⚡ AuraGate — Autonomous Legacy Wire Bridge & Spec Synthesizer

> **Kiroween 2026 Hackathon · Category: Resurrection**
> Bringing 1964 EBCDIC mainframes and 1987 ISO-8583 banking switches back to life — as modern OpenAPI 3.1 microservices.

---

## What Is AuraGate?

Thousands of banks and insurance companies still run mainframe systems that speak two dead languages:

- **EBCDIC / CP037** — IBM's 1964 character encoding, used in COBOL batch jobs and mainframe flat files
- **ISO-8583** — the 1987 binary wire protocol still used by every card payment switch on earth (Visa, Mastercard, Interac)

Migrating away from them costs millions of dollars and years of work because nobody has a tool that can **automatically read these binary packets and produce a modern API definition**.

**AuraGate does exactly that.** Drop in a raw hex payload. Get out:
- A decoded JSON field map with every field named and typed
- A valid **OpenAPI 3.1 specification** ready for Swagger UI or Postman
- A **TypeScript interface** ready to paste into your modern microservice

Zero manual mapping. Zero guesswork. Zero exceptions — ever.

---

## Live Demo

```
http://localhost:3000
```

The web console auto-loads a real ISO-8583 `0200` authorization request. Click **Unpack Fields** or **Synthesize OpenAPI + SDK** to see it work instantly.

---

## Features

| Feature | Details |
|---|---|
| **ISO-8583 Decoder** | Full 128-field bitmap support (primary + secondary), FIXED / LLVAR / LLLVAR fields |
| **EBCDIC CP037 Decoder** | Complete 256-byte code-point table, round-trip encode/decode |
| **COMP-3 Packed Decimal** | Signed nibbles 0xC/0xD/0xF, configurable implied decimal places |
| **OpenAPI 3.1 Synthesizer** | Auto-generates paths, schemas, and operationIds from any decoded packet |
| **TypeScript SDK Generator** | Emits typed interfaces alongside the OpenAPI spec |
| **MCP Server** | 3 tools callable directly from Kiro agent chat |
| **Never Throws** | All decoders return `Result<T, ParseError>` — fuzz-safe by design |
| **Property-Based Tests** | 1000-iteration round-trip + fuzz invariants for every codec |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the web server
npm run dev

# 3. Open the console
open http://localhost:3000

# 4. Run all property-based tests
npm test
```

---

## Sample Payloads

Three ready-to-use hex packets live in `/samples`. Paste any into the web console and hit a button:

**ISO-8583 `0200` Authorization Request** (`samples/iso8583-auth-request.hex`)
```
303230301038000000c08000303030303030303135303030343832393130313433303235313130345445524d303030314d45524348414e5430303030303120383430
```
Fields: Amount $150.00 · STAN 482910 · Time 14:30:25 · Date Nov 4 · Terminal TERM0001 · Merchant · Currency USD

**ISO-8583 `0800` Network Management** (`samples/iso8583-network-mgmt.hex`)
```
3038303080200000000000000400000000000000303030303031303031
```

**EBCDIC CP037 + COMP-3 Record** (`samples/ebcdic-comp3-record.hex`)
```
c1e4d9c1c7c1e3c540d9c5c3d6d9c4401500000c
```
Text: `AURAGATE RECORD ` · COMP-3 at offset 16, length 4 → value 150.00

---

## API Reference

### `POST /api/v1/bridge/iso8583`
Decodes a raw ISO-8583 hex payload into named fields.

```json
{ "payload": "30323030...", "encoding": "hex" }
```

### `POST /api/v1/bridge/ebcdic`
Decodes a CP037 EBCDIC buffer, with optional COMP-3 packed decimal extraction.

```json
{ "payload": "c8c5d3d3d66040...", "comp3Offset": 14, "comp3Length": 4 }
```

### `POST /api/v1/bridge/synthesize`
Generates an OpenAPI 3.1 spec + TypeScript types from any ISO-8583 hex payload.

```json
{ "payload": "30323030...", "serviceName": "PaymentSwitchV1" }
```

---

## MCP Tools (Kiro Agent)

AuraGate ships an MCP server at `src/mcp/server.ts`. In Kiro, configure it and then call from chat:

```
inspect_iso8583_stream({ payload: "30323030..." })
inspect_ebcdic_stream({ payload: "c8c5d3d3d660..." })
synthesize_microservice({ payload: "30323030...", serviceName: "CardAuthV2" })
```

To add it to Kiro, put this in `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "auragate": {
      "command": "node",
      "args": ["--import", "tsx/esm", "src/mcp/server.ts"],
      "disabled": false
    }
  }
}
```

---

## Project Structure

```
auragate/
├── src/
│   ├── core/
│   │   ├── ebcdic.ts         # CP037 codec + COMP-3 packed decimal
│   │   ├── iso8583.ts        # ISO-8583 bitmap unpacker + packer
│   │   └── synthesizer.ts    # OpenAPI 3.1 + TypeScript generator
│   ├── mcp/
│   │   └── server.ts         # MCP tool server (3 tools)
│   └── server.ts             # Express REST API + web console UI
├── tests/
│   └── pbt/
│       ├── ebcdic.pbt.test.ts   # Round-trip + fuzz tests for EBCDIC/COMP-3
│       └── iso8583.pbt.test.ts  # Round-trip + fuzz tests for ISO-8583
├── samples/
│   ├── iso8583-auth-request.hex
│   ├── iso8583-network-mgmt.hex
│   └── ebcdic-comp3-record.hex
└── .kiro/
    ├── steering/
    │   └── architecture.md   # Guardrails: zero-copy, pure codecs, no-throw policy
    ├── specs/
    │   └── core-pipeline/
    │       ├── requirements.md
    │       └── tasks.md
    └── hooks/
        └── test-on-save.json # Auto-runs PBT suite on .ts file save
```

---

## How Kiro Was Used

This entire project was built spec-first inside Kiro. Here's how each Kiro feature was put to work:

### Spec-Driven Development
The full pipeline was designed in `.kiro/specs/core-pipeline/` before a single line of code was written. `requirements.md` defined the 7 requirement groups (codecs, error handling, PBT, synthesis, MCP). `tasks.md` broke them into a 5-wave dependency graph so Kiro could implement them in the correct order without me having to micromanage sequencing. This is the core reason the codecs came out correct on the first pass — the spec forced the right constraints upfront.

### Steering Docs
`.kiro/steering/architecture.md` defines hard guardrails: zero-copy byte parsing only, `Result<T,E>` discriminated unions, no `any`, pure functions, and PBT required for every codec. Kiro respected these rules across every generated file — I never had to repeat "don't use string slicing" in chat because it was already in the steering doc.

### MCP Integration
The MCP server (`src/mcp/server.ts`) extends Kiro's own agent with three live tools. During development, I could paste a hex payload into Kiro chat, call `inspect_iso8583_stream` directly, and see the decoded fields inline — without leaving the IDE or switching to a terminal. This collapsed the test-and-verify loop dramatically.

### Agent Hooks
A `PostFileSave` hook (`.kiro/hooks/test-on-save.json`) automatically triggers the PBT suite whenever a `.ts` source file is saved. This meant every codec edit was instantly verified against 3000 property-based assertions without any manual `npm test` invocation.

### Vibe Coding
The initial architecture conversation happened in Kiro chat, where I described the problem domain (legacy mainframe → modern API). Kiro proposed the `Result<T, ParseError>` codec pattern, the 5-wave task dependency graph, and the decision to use `fast-check` for property testing. The conversation turned a blank repo into a complete, typed architecture plan in under 10 minutes.

---

## Test Results

All 10 property-based checks pass — 7000 total assertions across 7 invariants:

```
▶ EBCDIC CP037 Property Tests
  ✔ Round-trip alphanumeric invariance (40ms)
  ✔ Fuzz stability: arbitrary byte streams never throw uncaught errors (13ms)
✔ EBCDIC CP037 Property Tests (55ms)

▶ COMP-3 Packed Decimal Property Tests
  ✔ Round-trip signed integer fidelity (9ms)
  ✔ Fuzz rejection: random byte streams return ParseError gracefully (8ms)
✔ COMP-3 Packed Decimal Property Tests (19ms)

▶ ISO-8583 Bitmap Parsing Invariants
  ✔ Bitmap bit extraction round-trip (40ms)
  ✔ Round-trip message packing & unpacking (87ms)
  ✔ Fuzz stability: arbitrary bytes never throw unhandled crashes (10ms)
✔ ISO-8583 Bitmap Parsing Invariants (140ms)

tests: 10 | pass: 10 | fail: 0 | duration: 2578ms
```

---

## Architecture Design Decisions

**Why zero-copy?** Mainframe packets can be megabytes. String-converting them upfront wastes memory and hides encoding bugs. Operating on `Buffer.subarray` views means the codec sees the actual bytes.

**Why `Result<T, ParseError>` instead of try/catch?** In a payment processing context, a thrown exception that isn't caught costs money. The discriminated union forces every caller to handle the error case at compile time.

**Why property-based testing?** ISO-8583 has edge cases in bitmap boundary conditions that example-based tests won't find. Feeding 1000 random packets per run catches them.

**Why MCP?** It makes AuraGate a first-class citizen inside Kiro's agent. A developer debugging a legacy integration can call `synthesize_microservice` directly from their AI chat without leaving the IDE — that's the real modernization story.

---

## License

MIT — see [LICENSE](./LICENSE)

---

*Built with ❤️ and Kiro for Kiroween 2026 · Oyetunde Daniel*
