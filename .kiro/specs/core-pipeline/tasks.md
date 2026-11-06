# Implementation Plan: Core Wire De-serialization & Synthesis

## Overview
This implementation plan establishes the foundational codecs, property-based test suites, and schema synthesis engines for AuraGate. The workflow proceeds sequentially from zero-dependency low-level binary parsers to property testing invariants, culminating in an MCP-accessible OpenAPI synthesizer.

## Task Dependency Graph
```json
{
  "waves": [
    {
      "id": 1,
      "description": "Environment and project initialization",
      "tasks": ["1"]
    },
    {
      "id": 2,
      "description": "Foundational binary codecs",
      "tasks": ["2", "4"]
    },
    {
      "id": 3,
      "description": "Property-based invariant testing suites",
      "tasks": ["3", "5"]
    },
    {
      "id": 4,
      "description": "OpenAPI synthesis engine",
      "tasks": ["6"]
    },
    {
      "id": 5,
      "description": "MCP server integration",
      "tasks": ["7"]
    }
  ]
}
```

## Tasks
- [x] 1. Initialize project environment and build configurations
  - Set up package.json with TypeScript, tsx, fast-check, and @types/node.
  - Configure tsconfig.json with strict mode, ES2022 target, and NodeNext module resolution.
- [x] 2. Implement core EBCDIC and COMP-3 codecs
  - Create src/core/ebcdic.ts with CP037 byte conversion table.
  - Implement packed-decimal COMP-3 decoder supporting signed nibbles 0xC, 0xD, and 0xF.
- [x] 3. Implement property-based tests for EBCDIC codecs
  - Create tests/pbt/ebcdic.pbt.test.ts using fast-check.
  - Verify round-trip conversion invariance and fuzz stability against arbitrary byte arrays.
- [x] 4. Implement ISO-8583 bitmap unpacker
  - Create src/core/iso8583.ts supporting primary and secondary 128-bit bitmaps.
  - Implement bitmask parsing and fixed/variable field slicers.
- [x] 5. Implement property-based tests for ISO-8583
  - Create tests/pbt/iso8583.pbt.test.ts using fast-check.
  - Verify bitmap bitfield indexing and bounds safety on corrupted packets.
- [x] 6. Build OpenAPI 3.1 schema synthesizer
  - Create src/core/synthesizer.ts to map unpacked wire models into dynamic OpenAPI specifications.
- [x] 7. Implement AuraGate Model Context Protocol MCP server
  - Create src/mcp/server.ts exposing inspect_wire_stream and synthesize_microservice tools.

## Notes
- All codecs must remain pure functions returning Result types rather than throwing uncaught runtime exceptions.
- Property-based tests must run at least 1000 iterations per check to validate wire-format edge cases.
