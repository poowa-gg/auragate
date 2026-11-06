# AuraGate — Part 3: Scalability · Sustainability · Revenue · Business Plan · Financials

---

## Scalability Plan

### Technical Scalability

**v1.0 — Single server, stateless:**
- Express server on Vercel/Railway, zero shared state, deployable anywhere

**Phase 2 — Horizontal scale:**
- Stateless decode handlers scale to N instances behind a load balancer with zero coordination
- Each request is fully independent (no shared mutable state in any codec) — linear horizontal scale

**Phase 3 — Edge deployment:**
- Pure functions with no I/O → compilable to Cloudflare Workers or Vercel Edge
- Sub-10ms global decode latency at edge

**Phase 4 — Streaming:**
- Large mainframe batch files (hundreds of MB) → Node.js `Transform` stream, preserving zero-copy design

### Business Scalability

| Stage | Customers | Infrastructure | Team |
|---|---|---|---|
| Hackathon (Now) | 0 (demo) | Single Vercel deployment | 1 founder |
| Seed (Month 1–6) | 5–10 pilot banks/fintechs | Vercel Pro + PlanetScale DB | 3 people |
| Series A (Year 2) | 50–100 enterprise | AWS multi-region, SOC-2 | 15 people |
| Scale (Year 3) | 500+ integrations | Self-hosted enterprise option | 40 people |

---

## Sustainability Strategy

### Open Core Model
The decode engine (`src/core/`) stays MIT open-source permanently. This builds trust with security-sensitive financial institutions and creates a contributor community. Revenue comes from the hosted platform layer: team dashboards, history, CI/CD integrations, SSO, SLA — none in the open-source core.

### Environmental
- Serverless-compatible → no always-on idle compute waste
- Pure functions with zero I/O → CPU time proportional to actual usage, not polling
- Edge-deployable design eliminates unnecessary data centre round-trips

### Long-Term Relevance
- ISO-8583 will not disappear for 5–10 years minimum
- COBOL skill shortage accelerates each year — AuraGate's value **increases** over time
- The MCP interface makes AuraGate a permanent fixture in every AI-assisted payment developer's toolkit as Kiro and similar tools grow

---

## Revenue Model

### Tiered SaaS Pricing (Post-Hackathon v2.0)

| Tier | Price | Includes | Target |
|---|---|---|---|
| **Free / OSS** | $0 | Self-hosted, unlimited local decodes, MIT licence | Developers, students, OSS projects |
| **Starter** | $49/month | Hosted console, 50K decodes/month, 3 seats, 30-day history | Small fintechs, solo consultants |
| **Growth** | $299/month | 500K decodes/month, 10 seats, CI/CD plugin, Slack alerts | Mid-size payment processors |
| **Enterprise** | $1,500+/month | Unlimited decodes, SSO, SLA, on-prem option, SWIFT MT | Banks, large payment platforms |

### Additional Revenue Streams

| Stream | Description | Timing |
|---|---|---|
| Professional Services | Custom field dictionaries for proprietary ISO-8583 variants | Year 1 |
| API Usage Billing | Pay-per-decode above tier limits ($0.001/decode) | Year 1 |
| Enterprise Training | 2-day onboarding workshops for bank integration teams | Year 2 |
| Marketplace Listings | AWS, Azure, GCP Marketplace listings | Year 2 |
| OEM Licensing | Embed AuraGate decode engine in third-party platforms | Year 3 |

### Pricing Rationale
A single COBOL consultant **day** costs $500–$800. AuraGate's Starter tier at $49/month costs less than 2 hours of consultant time. The Enterprise tier at $1,500/month replaces over 2 months of junior consultant billable hours. The value capture is asymmetric in AuraGate's favour at every price point.

---

## Business Plan

### Company Overview
**AuraGate** is a developer tools company solving mainframe modernisation through autonomous protocol translation. Founded by Oyetunde Daniel, built spec-first using Kiro AI IDE during Kiroween 2026.

**Target markets:** Tier 2/3 banks · Fintech API companies · Payment processors · System integrators

### Go-To-Market Strategy

**Phase 1 — Community (Months 1–3):**
- Open-source GitHub launch with SEO-optimised README
- Hacker News: "Show HN: I built a tool that turns ISO-8583 packets into OpenAPI specs in 60 seconds"
- Dev.to / Medium articles targeting "ISO-8583 developer", "EBCDIC decoder", "mainframe modernisation"
- Join payment engineering Slack communities (Moov, NACHA, ISO-20022 forums)

**Phase 2 — Direct Outreach (Months 3–6):**
- Target integration engineers at Tier 2/3 banks via LinkedIn
- Pilot offer: "Send us 5 sample packets, get 5 OpenAPI specs in 24 hours"
- Partner with COBOL modernisation consultancies (position AuraGate as their accelerator tool)

**Phase 3 — Enterprise (Months 6–12):**
- AWS Marketplace listing (reaches pre-approved procurement teams)
- Attend Money20/20, Finovate, Sibos
- Publish case study from first paying bank pilot

### Key Partnerships

| Partner Type | Examples | Value |
|---|---|---|
| Cloud Providers | AWS, Azure, GCP | Marketplace distribution, co-sell motions |
| System Integrators | Cognizant, Accenture, DXC | White-label or accelerator partnership |
| Kiro / AWS | Kiro IDE team | Featured MCP tool, hackathon visibility |
| Payment Networks | Visa, Mastercard tech teams | Enterprise reference customers |

### Target Team (by Month 6)

| Role | Responsibility |
|---|---|
| Founder / CEO | Product, engineering, fundraising |
| Senior Full-Stack Engineer | SaaS dashboard, auth, billing, CI/CD plugin |
| Senior Payments Engineer | SWIFT MT, ISO-20022, NACHA field dictionaries |
| Enterprise Sales Lead | Bank outreach, demos, contract negotiation |

---

## Profitability Analysis

### Unit Economics

| Metric | Starter | Enterprise |
|---|---|---|
| Customer Acquisition Cost (CAC) | ~$50 (content/self-serve) | ~$5,000 (direct sales) |
| Average Revenue Per User (ARPU) | $49/month | $2,000/month |
| Gross Margin | ~85% | ~85% |
| Payback Period | 1 month | 2.5 months |
| LTV (24-mo / 36-mo avg churn) | $1,176 | $72,000 |
| LTV:CAC Ratio | **23.5x** | **14.4x** |

### Monthly Cost Structure at Month 12

| Item | Monthly ($) |
|---|---|
| Infrastructure (Vercel, DB, CDN) | 500 |
| Engineering salaries (2 engineers) | 25,000 |
| Sales (1 SDR/AE) | 8,000 |
| Marketing (content, events) | 2,000 |
| Legal / accounting | 1,000 |
| Tools / misc | 500 |
| **Total burn** | **$37,000** |

**Break-even:** ~155 Starter customers OR 19 Enterprise customers OR a mix.

---

## One-Year Financial Projection

> All USD. Seed: $500K at Month 0. Conservative: 20% MoM Starter growth, 1–2 new Enterprise/month after Month 4.

| Month | Starter | Enterprise | MRR ($) | Burn ($) | Net ($) | Cumulative Cash ($) |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 5,000 | -5,000 | **500,000** |
| 1 | 5 | 0 | 245 | 15,000 | -14,755 | 485,245 |
| 2 | 12 | 0 | 588 | 20,000 | -19,412 | 465,833 |
| 3 | 22 | 0 | 1,078 | 25,000 | -23,922 | 441,911 |
| 4 | 35 | 1 | 3,715 | 30,000 | -26,285 | 415,626 |
| 5 | 50 | 2 | 6,450 | 33,000 | -26,550 | 389,076 |
| 6 | 68 | 3 | 9,332 | 35,000 | -25,668 | 363,408 |
| 7 | 88 | 5 | 14,312 | 36,000 | -21,688 | 341,720 |
| 8 | 110 | 7 | 19,390 | 37,000 | -17,610 | 324,110 |
| 9 | 135 | 9 | 24,615 | 37,000 | -12,385 | 311,725 |
| 10 | 163 | 12 | 31,987 | 37,000 | -5,013 | 306,712 |
| 11 | 195 | 15 | 39,555 | 37,000 | **+2,555** | 309,267 |
| 12 | 230 | 18 | 47,270 | 37,000 | **+10,270** | **319,537** |

### Month 12 Summary

| Metric | Value |
|---|---|
| Monthly Recurring Revenue (MRR) | **$47,270** |
| Annualised Recurring Revenue (ARR) | **$567,240** |
| Cash remaining from seed | **$319,537** |
| Operating status | **Cash-flow positive from Month 11** |
| Gross margin | ~85% |
| Runway at Month 12 | **8+ months** remaining |

### Key Assumptions
1. Starter churn: 5%/month (benchmark for dev tools: 3–8%)
2. Enterprise churn: 2%/month (sticky due to workflow integration)
3. Enterprise ARPU: $2,000/month (conservative; some on $3,000+ plans)
4. Seed: $500,000 — covers 13+ months at peak burn
5. Infrastructure scales sub-linearly (serverless model)

### Path to Series A
With $47K MRR and 248 customers at Month 12, AuraGate is positioned for a **$3–5M Series A** at a 10x ARR multiple (~$5.7M valuation floor) to expand the team, launch SWIFT MT / ISO-20022 modules, and pursue Fortune 500 bank contracts.

---

## Sources & References

| Claim | Source | Link |
|---|---|---|
| Mainframe modernization market $9.01B (2026) | Straits Research 2026 | [straitsresearch.com](https://straitsresearch.com/report/mainframe-modernization-market) |
| Market $8.39B→$13.34B at 9.7% CAGR | MarketsandMarkets 2025 | [marketsandmarkets.com](https://www.marketsandmarkets.com/Market-Reports/mainframe-modernization-market-52477.html) |
| Services market $21.5B→$76.2B at 15.1% CAGR | Credence Research 2024 | [credenceresearch.com](https://www.credenceresearch.com/report/mainframe-modernization-services-market) |
| CAGR 14.8% (2025–2030) | The Business Research Company 2025 | [thebusinessresearchcompany.com](https://www.thebusinessresearchcompany.com/report/mainframe-modernization-global-market-report) |
| COBOL avg age 55+; <1% CS grads study COBOL | in-com.com 2026 | [in-com.com](https://www.in-com.com/blog/top-cobol-modernization-vendors-in-2025-2026-from-legacy-to-cloud/) |
| Legacy skills crisis at 10%/year | taazaa.com 2026 | [taazaa.com](https://www.taazaa.com/blog/the-skills-crisis-why-legacy-experts-are-disappearing) |
| $5.5 trillion global IT skills shortage | IDC via planetmainframe.com 2026 | [planetmainframe.com](https://planetmainframe.com/2026/01/missing-mainframe-and-it-skills-how-enterprises-can-respond/) |
| COBOL consultant avg salary $125,812/yr | Glassdoor 2026 | [glassdoor.com](https://www.glassdoor.com/Salaries/mainframe-consultant-cobol-developer-salary-SRCH_KO0,36.htm) |
| ISO-8583 remains on card rails for years | tapix.io 2026 | [tapix.io](https://www.tapix.io/resources/post/iso-8583-vs-iso-20022) |
| Endava ISO-8583 integration service | Microsoft Marketplace | [marketplace.microsoft.com](https://marketplace.microsoft.com/en-ie/product/endavauklimited1625147006011.legacy_iso8583) |
| IsoBridge open-source | GitHub | [github.com/gabyslaw/IsoBridge](https://github.com/gabyslaw/IsoBridge) |
| API gateway pricing 2026 | Zuplo 2026 | [zuplo.com](https://zuplo.com/learning-center/api-gateway-pricing-comparison-2026) |
