# AuraGate — Part 4: GitHub · Vercel Deployment · Demo Script

---

## GitHub Push Guide (Hackathon Requirements)

The hackathon requires:
- Public repo with an approved OSI open-source licence ✅ (MIT — already in LICENSE file)
- The `/.kiro` directory at the root — NOT in .gitignore ✅
- A URL to a functional application

### Step 1 — Create the GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Set:
   - Repository name: `auragate`
   - Visibility: **Public**
   - Do NOT initialise with README (you already have one)
3. Click **Create repository**
4. Copy the repo URL, e.g. `https://github.com/YOUR_USERNAME/auragate.git`

### Step 2 — Check your .gitignore

Open `.gitignore` and confirm `.kiro` is NOT listed. If it is, remove it. Run this in your terminal to verify:

```powershell
Get-Content .gitignore | Select-String "kiro"
```

If that returns nothing, you're safe. If it returns a line, remove it.

### Step 3 — Initialise git and push

Run these commands one at a time in your project root (`c:\Users\HP\auragate`):

```powershell
# Initialise git (if not already done)
git init

# Stage everything — including .kiro which judges MUST see
git add .


# Check what will be committed — confirm .kiro is in the list
git status

# Make the first commit
git commit -m "feat: AuraGate v1.0 - Kiroween 2026 Hackathon submission"

# Add your GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/auragate.git

# Push to main
git push -u origin main
```

### Step 4 — Verify on GitHub

After pushing, open your repo on GitHub and confirm:
- `/.kiro/` folder is visible at the root ✅
- `README.md` renders correctly ✅
- `LICENSE` file is present ✅
- `src/`, `tests/`, `samples/`, `docs/` are all visible ✅

### Step 5 — Add repo topics (boosts discoverability for judges)

On your GitHub repo page → gear icon next to "About" → add topics:
```
iso-8583  ebcdic  openapi  typescript  mcp  kiro  mainframe-modernization  fintech  kiroween-2026
```

---

## Vercel Deployment Guide

Vercel is the fastest path to a live URL for judges to click.

### Step 1 — Sign up / log in

Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.

### Step 2 — Import your project

1. Click **Add New → Project**
2. Select your `auragate` GitHub repo
3. Vercel will auto-detect it — click **Import**

### Step 3 — Configure the build settings

Vercel needs to know how to run an Express server. On the configuration screen:

| Setting | Value |
|---|---|
| Framework Preset | **Other** |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Then click **Environment Variables** and add:
```
NODE_ENV = production
```

### Step 4 — Add a vercel.json for Express routing

Create this file at the root of your project:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ]
}
```

Push it to GitHub:
```powershell
git add vercel.json
git commit -m "chore: add Vercel deployment config"
git push
```

### Step 5 — Deploy

Click **Deploy** on Vercel. Wait ~60 seconds.

Your live URL will be: `https://auragate-YOUR_USERNAME.vercel.app`

### Step 6 — Verify the live app

Open the URL and confirm:
- The AuraGate console loads with the ISO-8583 sample pre-filled ✅
- Click "Unpack Fields" → decoded JSON appears ✅
- Click "Synthesize OpenAPI + SDK" → OpenAPI spec appears ✅
- Open on your phone → layout is responsive ✅

### Step 7 — Copy the URL for your submission

This is your **functional application URL** for the Devpost submission form.

---

## 2-Minute 30-Second Demo Script

> **Tools:** OBS for screen recording · Canva for intro/outro slide
> **Total runtime:** 2 minutes 28 seconds
> **Energy:** Confident, fast, no filler words. Speak like you solved a real problem — because you did.

---

### SEGMENT 1 — Hook (0:00–0:20) · Canva slide

**[Show: Canva title slide — "AuraGate" logo, tagline, your name]**

> *"Every time you tap your card, your payment travels through a binary protocol written in 1987 called ISO-8583. Banks still run it on IBM mainframes in a character encoding called EBCDIC — from 1964. Modernising these systems costs millions of dollars and years of work. AuraGate changes that."*

**[Transition to screen share]**

---

### SEGMENT 2 — The Live Demo (0:20–1:30)

**[OBS scene: browser showing `https://auragate.vercel.app` — full screen, no distractions]**

> *"This is AuraGate. I'm on the live deployed app right now."*

**[Point to the pre-loaded hex in the ISO-8583 tab]**

> *"What you see pre-loaded is a real ISO-8583 authorization request — the kind your bank's payment switch sends when you swipe a card. Raw binary. Hex encoded. Completely unreadable to a normal developer."*

**[Click "Unpack Fields"]** ← pause for 1 second for the result to appear

> *"One click. Every field decoded. Field 4 — that's the transaction amount. Field 41 — terminal ID. Field 49 — currency code 840, that's US dollars. Named, typed, structured JSON."*

**[Click the "OpenAPI Synthesizer" tab, paste the same hex, type "CardAuthV2", click "Synthesize"]**

> *"Now watch this. Same packet. I give it a service name — CardAuthV2 — and hit Synthesize."*

**[Let the output render, scroll through it briefly]**

> *"AuraGate just generated a valid OpenAPI 3.1 specification and a TypeScript interface — automatically — from that raw binary packet. This is a spec you can paste directly into Postman, import into Swagger UI, or feed into AWS API Gateway. What normally takes a COBOL consultant three months to produce just happened in under a second."*

**[Click the Architecture tab — show it briefly]**

> *"The engine is zero-copy binary parsing, pure functions, TypeScript strict mode, and a Result type that never throws — critical in payments where an uncaught exception means a failed transaction."*

---

### SEGMENT 3 — Kiro Integration (1:30–2:00)

**[Switch OBS scene: Kiro IDE with MCP tool call visible in agent chat]**

> *"AuraGate also ships as a native Kiro MCP server. Three tools — inspect_iso8583_stream, inspect_ebcdic_stream, and synthesize_microservice — callable directly from this chat panel. I built this entire system spec-first inside Kiro."*

**[Show .kiro/specs/core-pipeline/tasks.md briefly]**

> *"The architecture rules live in a steering doc. The requirements and 5-wave task dependency graph live in specs. A PostFileSave hook auto-runs 7,000 property-based test assertions every time I save a TypeScript file. Kiro read the spec, respected the architecture guardrails, and generated code that passed property-based testing on the first run."*

---

### SEGMENT 4 — The Opportunity (2:00–2:20)

**[Switch OBS scene: Canva market slide — "$8B market, 10%/year COBOL cliff"]**

> *"An $8 billion market, racing toward $18 billion by 2034, according to Straits Research. COBOL experts retire at roughky 10% a year, and AuraGate grows more valuable with everyone that leaves. This no hackathon toy. It's production-grade, MIT open source, with a path to Saas, projected cash-flow positive by month eleven."*


---

### SEGMENT 5 — Close (2:20–2:28) · Canva outro slide

**[Show: Canva outro — GitHub URL, live app URL, "AuraGate · Kiroween 2026"]**

> *"AuraGate. Drop in a 40-year-old binary packet. Walk out with a production-ready API. The code is live on GitHub. The app is deployed right now. Thank you."*

---

### OBS Scene List (set these up before recording)

| Scene | Content | Duration |
|---|---|---|
| Scene 1 — Intro | Canva title slide fullscreen | 0:00–0:20 |
| Scene 2 — Browser Demo | Chrome fullscreen, AuraGate app | 0:20–1:30 |
| Scene 3 — Kiro IDE | Kiro IDE, MCP chat + specs visible | 1:30–2:00 |
| Scene 4 — Market Slide | Canva market data slide | 2:00–2:20 |
| Scene 5 — Outro | Canva outro slide | 2:20–2:28 |

### OBS Settings for YouTube upload

- Resolution: 1920×1080
- Frame rate: 30fps
- Output format: MP4 (H.264)
- Audio: 44.1kHz, stereo
- Bitrate: 6000 Kbps (clean for screen recordings)

### Canva Slides Checklist

**Slide 1 (Intro):**
- Title: `AuraGate`
- Subtitle: `Autonomous Legacy Wire Bridge & Spec Synthesizer`
- Bottom: `Kiroween 2026 · Resurrection Category · Oyetunde Daniel`
- Style: Dark background (#0a0d12), orange accent (#f97316)

**Slide 2 (Market — for segment 4):**
- Headline: `$9B Market. 10%/year COBOL cliff. The problem gets worse every year.`
- 3 stats boxes: `$9B Market Today` · `$18.63B by 2034` · `COBOL devs: avg age 55+`
- Source footnote: Straits Research 2026 · Glassdoor 2026

**Slide 3 (Outro):**
- `AuraGate — github.com/YOUR_USERNAME/auragate`
- `Live: https://auragate.vercel.app`
- `MIT Open Source · Kiroween 2026`
- Tagline: `"Drop in a 40-year-old packet. Walk out with a modern API."`

---

### Final Pre-Submission Checklist

- [ ] GitHub repo is public with `.kiro/` visible at root
- [ ] MIT `LICENSE` file present
- [ ] Live Vercel URL works and auto-loads the sample
- [ ] Demo video is uploaded to YouTube (public or unlisted, not private)
- [ ] Video is ≤ 3 minutes (yours is 2:28 ✅)
- [ ] Devpost submission includes: repo URL, app URL, video URL, category (Resurrection), write-up on Kiro usage
- [ ] Kiro write-up covers all 5 features: vibe coding, specs, steering, hooks, MCP
