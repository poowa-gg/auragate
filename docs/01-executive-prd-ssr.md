# AuraGate — Part 1: Executive Summary · PRD · SSR

> Kiroween 2026 · Resurrection Category · Author: Oyetunde Daniel

---

## Executive Summary

### The Problem

The global financial system runs on technology that predates the internet. Over **$10 trillion in daily payment volume** moves through ISO-8583 binary wire protocols — a standard written in 1987. Mainframe COBOL and EBCDIC systems process 95% of ATM transactions and 80% of credit card transactions worldwide.

Every bank or fintech that wants a modern REST API must first solve an unsolved problem: **how do you read a 40-year-old binary packet and turn it into something modern developers can work with?**

Today that work is done by COBOL consultants billing at **$125,000–$197,000/year** ([Glassdoor 2026](https://www.glassdoor.com/Salaries/mainframe-consultant-cobol-developer-salary-SRCH_KO0,36.htm)). The average COBOL developer is now **above 55 years old**, fewer than 1% of CS graduates study COBOL ([in-com.com 2026](https://www.in-com.com/blog/top-cobol-modernization-vendors-in-2025-2026-from-legacy-to-cloud/)), and the skills cliff is accelerating at **10% per year** ([taazaa.com 2026](https://www.taazaa.com/blog/the-skills-crisis-why-legacy-experts-are-disappearing)). IT skill shortages cost the global economy an estimated **$5.5 trillion** ([IDC via planetmainframe.com 2026](https://planetmainframe.com/2026/01/missing-mainframe-and-it-skills-how-enterprises-can-respond/)).

### The Solution

**AuraGate** is an autonomous bridge engine. Drop in a raw binary/hex packet — EBCDIC/CP037 mainframe buffer or ISO-8583 financial switch message — and instantly receive:

- Structured **JSON** with every field decoded and named
- A valid **OpenAPI 3.1 specification** for any API tool or gateway
- A **TypeScript SDK interface** ready to paste into a microservice
- A **live REST API** (3 endpoints) for programmatic integration
- A **Kiro MCP server** with 3 tools callable directly from the AI agent

Zero manual mapping. Zero COBOL expertise required. Milliseconds, not months.

### Market Opportunity

| Source | Metric | Value |
|---|---|---|
| [Straits Research 2026](https://straitsresearch.com/report/mainframe-modernization-market) | Modernization market 2026 | $9.01B |
| [Straits Research 2026](https://straitsresearch.com/report/mainframe-modernization-market) | Projected 2034 | $18.63B at 9.5% CAGR |
| [MarketsandMarkets 2025](https://www.marketsandmarkets.com/Market-Reports/mainframe-modernization-market-52477.html) | Market 2025→2030 | $8.39B → $13.34B at 9.7% CAGR |
| [Credence Research 2024](https://www.credenceresearch.com/report/mainframe-modernization-services-market) | Total services market by 2032 | $76.2B at 15.1% CAGR |
| [tapix.io 2026](https://www.tapix.io/resources/post/iso-8583-vs-iso-20022) | ISO-8583 remaining lifespan on card rails | "Years" after ISO-20022 migration |

### The Ask

**$500,000 seed** to hire 2 engineers + 1 sales lead, build hosted SaaS, and close 10 pilot bank/fintech customers within 12 months.

---

## Product Requirements Document (PRD)

### Vision

AuraGate makes every legacy binary protocol readable, documentable, and modernisable — autonomously — so any developer can produce a production-ready API spec from a raw wire sample in under 60 seconds.

### Target Users

| Persona | Pain Point |
|---|---|
| Fintech Integration Engineer | Weeks mapping ISO-8583 fields from outdated PDFs |
| Bank Modernisation Architect | No tooling to auto-document what legacy systems send |
| Payments Platform Developer | Must hire $125K consultants to understand wire format |
| DevOps / Platform Engineer | No automated way to derive OpenAPI from a binary sample |
| Kiro / AI Agent Developer | No MCP-native wire inspection tools existed before AuraGate |

### Feature Set (v1.0)

| Feature | Priority | Status |
|---|---|---|
| ISO-8583 decoder — 128-bit bitmap | P0 | ✅ Complete |
| EBCDIC CP037 decoder — full 256-byte table | P0 | ✅ Complete |
| COMP-3 packed decimal decoder | P0 | ✅ Complete |
| OpenAPI 3.1 synthesizer | P0 | ✅ Complete |
| TypeScript interface generator | P0 | ✅ Complete |
| REST API — 3 endpoints | P0 | ✅ Complete |
| Responsive web console — mobile-first | P1 | ✅ Complete |
| MCP server — 3 agent tools | P1 | ✅ Complete |
| PBT suite — 1000 iterations, round-trip + fuzz | P0 | ✅ Complete |
| Sample hex payloads | P1 | ✅ Complete |

### Success Metrics

- Zero field mapping errors on any valid ISO-8583 packet
- OpenAPI output passes [openapi-spec-validator](https://github.com/p1c2u/openapi-spec-validator) with 0 errors
- Zero uncaught exceptions across 7,000 fuzz runs
- Web console functional on screens ≥ 320px

### Roadmap

| Phase | Timeline | Features |
|---|---|---|
| v2.0 | Q1 2027 | Hosted SaaS, team accounts, history, SWIFT MT |
| v2.1 | Q2 2027 | ISO-20022 migration assistant, spec diff-viewer |
| v3.0 | Q3 2027 | GitHub Actions / GitLab CI plugin, test stub generator |
| v3.1 | Q4 2027 | AI field annotation, auto-detect encoding from raw bytes |

---

## System & Solution Requirements (SSR)

### Functional Requirements

| ID | Requirement | Verification |
|---|---|---|
| FR-01 | Decode 64-bit or 128-bit ISO-8583 bitmap without throwing | PBT fuzz: 1000 random byte arrays → 0 exceptions |
| FR-02 | Return `ParseError` with byte offset + field number on bad input | Unit test: truncated buffers, missing LLVAR headers |
| FR-03 | Map all 256 CP037 code points to UTF-8 | Round-trip: `decode(encode(s)) === s` for all printable ASCII |
| FR-04 | COMP-3 handles sign nibbles 0xC, 0xD, 0xF with configurable scale | Round-trip: 1000 random integers ±9,999,999 |
| FR-05 | Synthesizer produces valid OpenAPI 3.1 | Validate via [openapi-spec-validator](https://github.com/p1c2u/openapi-spec-validator) |
| FR-06 | REST API accepts hex and base64 payloads | Integration test on both encodings |
| FR-07 | Web console works on screens ≥ 320px | Manual test on 320px viewport |
| FR-08 | MCP server exposes 3 tools with valid JSON schema | Kiro MCP tool list inspection |

### Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Decode latency p99 | ≤ 50ms for any payload ≤ 64KB |
| NFR-02 | Memory | Zero intermediate heap allocations for byte inspection |
| NFR-03 | Type safety | No `any`; `strict: true` in tsconfig |
| NFR-04 | Error surface | 0 unhandled rejections; all codecs return `Result<T,E>` |
| NFR-05 | Cold start | Server ready in < 2 seconds |

### Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Node.js v20+ | LTS, native Buffer API, ESM |
| Language | TypeScript 5.6 strict | Compile-time safety for byte-level ops |
| HTTP | Express 4 | Minimal overhead, proven in payments |
| MCP | @modelcontextprotocol/sdk | Official Kiro MCP SDK |
| Testing | fast-check + node:test | PBT without heavy external runner |
| Build | tsx | Zero-config TypeScript execution |
