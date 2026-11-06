import express, { Request, Response } from 'express';
import { unpackIso8583, packIso8583 } from './core/iso8583.js';
import { decodeCp037, decodeComp3, encodeCp037, encodeComp3 } from './core/ebcdic.js';
import { synthesizeFromIso } from './core/synthesizer.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Ingest & unpack ISO-8583 packet
app.post('/api/v1/bridge/iso8583', (req: Request, res: Response): void => {
  const { payload, encoding = 'hex' } = req.body;
  if (!payload) {
    res.status(400).json({ error: 'Payload is required' });
    return;
  }

  const buf = Buffer.from(payload, encoding as BufferEncoding);
  const result = unpackIso8583(buf);

  if (!result.success) {
    res.status(422).json({ error: result.error });
    return;
  }

  res.json({ success: true, message: result.value });
});

// Ingest & decode EBCDIC / COMP-3 packet
app.post('/api/v1/bridge/ebcdic', (req: Request, res: Response): void => {
  const { payload, comp3Offset, comp3Length, decimals = 0 } = req.body;
  if (!payload) {
    res.status(400).json({ error: 'Payload is required' });
    return;
  }

  const buf = Buffer.from(payload, 'hex');
  const textResult = decodeCp037(buf);

  const response: Record<string, unknown> = {
    decodedText: textResult.success ? textResult.value : null
  };

  if (typeof comp3Offset === 'number' && typeof comp3Length === 'number') {
    const slice = buf.subarray(comp3Offset, comp3Offset + comp3Length);
    const comp3Result = decodeComp3(slice, decimals);
    response.comp3Value = comp3Result.success ? comp3Result.value : comp3Result.error;
  }

  res.json({ success: true, ...response });
});

// Autonomous Synthesis Endpoint
app.post('/api/v1/bridge/synthesize', (req: Request, res: Response): void => {
  const { payload, serviceName = 'AuraGate Bridged Core' } = req.body;
  if (!payload) {
    res.status(400).json({ error: 'Payload is required' });
    return;
  }

  const buf = Buffer.from(payload, 'hex');
  const result = unpackIso8583(buf);

  if (!result.success) {
    res.status(422).json({ error: 'Failed to unpack wire payload: ' + result.error.message });
    return;
  }

  const synthesized = synthesizeFromIso(result.value, serviceName);
  res.json({ success: true, ...synthesized });
});

// Interactive Web Console Dashboard
app.get('/', (_req: Request, res: Response): void => {
  // Pre-generate sample raw ISO hex for one-click testing
  const sampleIso = packIso8583('0200', {
    4: '000000015000',
    11: '482910',
    41: 'TERM0001',
    42: 'MERCHANT000001 ',
    49: '840',
  }).toString('hex');

  const sampleEbcdic = encodeCp037('HELLO AURAGATE').toString('hex');

  // Pre-pack a COMP-3 sample: value=15000, 4 bytes, 2 decimal places
  const sampleComp3Offset = Buffer.from(sampleEbcdic, 'hex').length;
  const comp3Buf = encodeComp3(15000, 4, 2);
  const fullEbcdicSample = Buffer.concat([Buffer.from(sampleEbcdic, 'hex'), comp3Buf]).toString('hex');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AuraGate — Autonomous Legacy Wire Synthesizer</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #0a0d12;
      --surface:   #111720;
      --surface2:  #161d27;
      --border:    #1e2d40;
      --accent:    #f97316;
      --accent2:   #fb923c;
      --blue:      #38bdf8;
      --green:     #4ade80;
      --red:       #f87171;
      --muted:     #64748b;
      --text:      #e2e8f0;
      --code:      #94d4ff;
      --font-mono: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
      font-size: 15px;
      line-height: 1.6;
      min-height: 100vh;
    }

    /* ── HEADER ── */
    header {
      background: linear-gradient(135deg, #0a0d12 0%, #0f1923 60%, #131e2e 100%);
      border-bottom: 1px solid var(--border);
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 40px; height: 40px;
      background: var(--accent);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .brand-name { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .brand-name span { color: var(--accent); }
    .badge {
      font-size: 11px; font-weight: 600; padding: 3px 10px;
      border-radius: 20px; border: 1px solid;
      white-space: nowrap;
    }
    .badge-online { border-color: var(--green); color: var(--green); background: rgba(74,222,128,.08); }
    .badge-cat { border-color: var(--accent); color: var(--accent); background: rgba(249,115,22,.08); }
    .header-badges { display: flex; gap: 8px; flex-wrap: wrap; }

    /* ── HERO ── */
    .hero {
      padding: 32px 24px 20px;
      text-align: center;
      background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(249,115,22,.12) 0%, transparent 70%);
    }
    .hero h1 { font-size: clamp(22px, 4vw, 36px); font-weight: 800; color: #fff; margin-bottom: 10px; }
    .hero h1 span { color: var(--accent); }
    .hero p { color: var(--muted); max-width: 680px; margin: 0 auto 20px; font-size: 14px; }
    .pipeline-steps {
      display: flex; align-items: center; justify-content: center;
      gap: 6px; flex-wrap: wrap; margin-bottom: 4px;
    }
    .step {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600;
      color: var(--text);
    }
    .arrow { color: var(--accent); font-size: 18px; }

    /* ── TABS ── */
    .tabs {
      display: flex; border-bottom: 1px solid var(--border);
      padding: 0 24px; gap: 0; overflow-x: auto;
    }
    .tab {
      padding: 12px 20px; font-size: 13px; font-weight: 600;
      cursor: pointer; color: var(--muted); border-bottom: 2px solid transparent;
      white-space: nowrap; transition: color .15s, border-color .15s;
      background: none; border-top: none; border-left: none; border-right: none;
    }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .tab:hover:not(.active) { color: var(--text); }

    /* ── MAIN LAYOUT ── */
    .main { padding: 20px 24px; max-width: 1400px; margin: 0 auto; }
    .pane { display: none; }
    .pane.active { display: block; }

    /* ── PANEL GRID ── */
    .panel-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 768px) {
      .panel-grid { grid-template-columns: 1fr; }
      header { padding: 14px 16px; }
      .main { padding: 16px; }
      .tabs { padding: 0 16px; }
      .hero { padding: 20px 16px 16px; }
    }

    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .panel-head {
      padding: 12px 16px;
      background: var(--surface2);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
    }
    .panel-head h3 { font-size: 13px; font-weight: 600; color: var(--text); }
    .panel-body { padding: 16px; }

    /* ── FORM ELEMENTS ── */
    label { font-size: 12px; color: var(--muted); display: block; margin-bottom: 6px; }
    textarea, input[type=text], input[type=number] {
      width: 100%; background: #07090e; color: var(--code);
      border: 1px solid var(--border); border-radius: 6px;
      padding: 10px 12px; font-family: var(--font-mono); font-size: 12px;
      outline: none; resize: vertical; transition: border-color .15s;
    }
    textarea:focus, input:focus { border-color: var(--accent); }
    textarea { height: 120px; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }

    .btn-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .btn {
      padding: 9px 18px; border-radius: 6px; font-size: 13px; font-weight: 600;
      cursor: pointer; border: none; transition: opacity .15s, transform .1s;
      white-space: nowrap;
    }
    .btn:hover { opacity: .88; }
    .btn:active { transform: scale(.97); }
    .btn-primary { background: var(--accent); color: #000; }
    .btn-green   { background: #166534; color: var(--green); border: 1px solid #166534; }
    .btn-ghost   { background: transparent; color: var(--muted); border: 1px solid var(--border); }
    .btn:disabled { opacity: .4; cursor: not-allowed; }

    /* ── OUTPUT ── */
    .output-label {
      font-size: 11px; color: var(--muted); margin-bottom: 6px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .output-label .copy-btn {
      font-size: 11px; background: none; border: none; color: var(--muted);
      cursor: pointer; padding: 2px 6px; border-radius: 4px;
    }
    .output-label .copy-btn:hover { color: var(--text); }
    pre.output {
      background: #07090e; border: 1px solid var(--border); border-radius: 6px;
      padding: 14px; overflow: auto; max-height: 420px;
      font-family: var(--font-mono); font-size: 12px; line-height: 1.6;
      color: var(--green); white-space: pre-wrap; word-break: break-all;
    }
    pre.output.error { color: var(--red); }
    pre.output.idle { color: var(--muted); }
    .spinner { display: inline-block; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── FEATURE CARDS ── */
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 18px; transition: border-color .2s;
    }
    .card:hover { border-color: var(--accent); }
    .card-icon { font-size: 28px; margin-bottom: 10px; }
    .card h4 { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #fff; }
    .card p { font-size: 12px; color: var(--muted); line-height: 1.5; }

    /* ── ARCH DIAGRAM ── */
    .arch {
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
      padding: 24px; margin-top: 16px;
    }
    .arch h3 { font-size: 14px; font-weight: 700; margin-bottom: 16px; color: var(--accent); }
    .arch-flow {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; flex-wrap: wrap;
    }
    .arch-node {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 16px; text-align: center;
      font-size: 12px; min-width: 110px;
    }
    .arch-node .node-type { font-size: 10px; color: var(--muted); margin-bottom: 2px; }
    .arch-node .node-name { font-weight: 700; color: #fff; }
    .arch-node.highlight { border-color: var(--accent); background: rgba(249,115,22,.07); }
    .arch-arrow { color: var(--accent); font-size: 20px; }

    /* ── FOOTER ── */
    footer {
      text-align: center; padding: 20px 24px;
      font-size: 12px; color: var(--muted);
      border-top: 1px solid var(--border); margin-top: 32px;
    }
    footer a { color: var(--accent); text-decoration: none; }
    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>

<header>
  <div class="brand">
    <div class="brand-icon">⚡</div>
    <span class="brand-name">Aura<span>Gate</span></span>
  </div>
  <div class="header-badges">
    <span class="badge badge-online">● Bridge Online</span>
    <span class="badge badge-cat">🎃 Kiroween 2026 — Resurrection</span>
  </div>
</header>

<div class="hero">
  <h1>Autonomous <span>Legacy Wire</span> Bridge &amp; Spec Synthesizer</h1>
  <p>
    Drop any 1980s ISO‑8583 banking switch packet or EBCDIC mainframe buffer.
    AuraGate decodes it, maps every field, and auto-generates a production-ready
    OpenAPI 3.1 specification + TypeScript SDK — in milliseconds.
  </p>
  <div class="pipeline-steps">
    <div class="step">📦 Raw Hex / EBCDIC</div>
    <div class="arrow">→</div>
    <div class="step">🔬 Zero-Copy Decode</div>
    <div class="arrow">→</div>
    <div class="step">📐 Field Mapping</div>
    <div class="arrow">→</div>
    <div class="step">🧬 OpenAPI 3.1</div>
    <div class="arrow">→</div>
    <div class="step">🚀 TypeScript SDK</div>
  </div>
</div>

<div class="tabs">
  <button class="tab active" onclick="switchTab('iso')">ISO‑8583 Decoder</button>
  <button class="tab" onclick="switchTab('ebcdic')">EBCDIC Decoder</button>
  <button class="tab" onclick="switchTab('synth')">OpenAPI Synthesizer</button>
  <button class="tab" onclick="switchTab('about')">Architecture</button>
</div>

<div class="main">

  <!-- ── TAB: ISO-8583 ── -->
  <div id="pane-iso" class="pane active">
    <div class="panel-grid">
      <div class="panel">
        <div class="panel-head">
          <h3>🏦 ISO‑8583 Wire Packet</h3>
          <button class="btn btn-ghost" style="font-size:11px; padding:4px 10px;"
            onclick="loadSample('iso')">Load Sample</button>
        </div>
        <div class="panel-body">
          <label>Raw Hex Payload</label>
          <textarea id="iso-payload" spellcheck="false" placeholder="Paste ISO-8583 hex bytes…"></textarea>
          <div class="btn-row">
            <button class="btn btn-primary" onclick="unpackIso()">⚡ Unpack Fields</button>
            <button class="btn btn-ghost" onclick="clearPane('iso')">Clear</button>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3 id="iso-out-title">Decoded Output</h3>
          <button class="copy-btn output-label" onclick="copyOutput('iso-output')">⎘ copy</button>
        </div>
        <div class="panel-body">
          <pre id="iso-output" class="output idle">// Unpacked ISO‑8583 fields will appear here…</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- ── TAB: EBCDIC ── -->
  <div id="pane-ebcdic" class="pane">
    <div class="panel-grid">
      <div class="panel">
        <div class="panel-head">
          <h3>🖥 EBCDIC / COMP‑3 Buffer</h3>
          <button class="btn btn-ghost" style="font-size:11px; padding:4px 10px;"
            onclick="loadSample('ebcdic')">Load Sample</button>
        </div>
        <div class="panel-body">
          <label>Hex-encoded EBCDIC payload (CP037)</label>
          <textarea id="ebcdic-payload" spellcheck="false" placeholder="Paste hex-encoded EBCDIC bytes…"></textarea>
          <div class="form-row">
            <div>
              <label>COMP‑3 Start Offset (bytes)</label>
              <input type="number" id="ebcdic-offset" placeholder="e.g. 14" min="0">
            </div>
            <div>
              <label>COMP‑3 Length (bytes)</label>
              <input type="number" id="ebcdic-length" placeholder="e.g. 4" min="1">
            </div>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" onclick="decodeEbcdic()">⚡ Decode Buffer</button>
            <button class="btn btn-ghost" onclick="clearPane('ebcdic')">Clear</button>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3>Decoded Text &amp; COMP‑3 Value</h3>
          <button class="copy-btn output-label" onclick="copyOutput('ebcdic-output')">⎘ copy</button>
        </div>
        <div class="panel-body">
          <pre id="ebcdic-output" class="output idle">// Decoded EBCDIC text and COMP‑3 packed decimal will appear here…</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- ── TAB: SYNTHESIZER ── -->
  <div id="pane-synth" class="pane">
    <div class="panel-grid">
      <div class="panel">
        <div class="panel-head">
          <h3>🧬 OpenAPI 3.1 Synthesizer</h3>
          <button class="btn btn-ghost" style="font-size:11px; padding:4px 10px;"
            onclick="loadSample('synth')">Load Sample</button>
        </div>
        <div class="panel-body">
          <label>ISO‑8583 Hex Payload</label>
          <textarea id="synth-payload" spellcheck="false" placeholder="Paste ISO-8583 hex bytes…"></textarea>
          <div style="margin-top:10px;">
            <label>Service Name</label>
            <input type="text" id="synth-name" value="PaymentSwitchV1" placeholder="e.g. PaymentSwitchV1">
          </div>
          <div class="btn-row">
            <button class="btn btn-green" onclick="synthesizeApi()">🚀 Synthesize OpenAPI + SDK</button>
            <button class="btn btn-ghost" onclick="clearPane('synth')">Clear</button>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h3 id="synth-out-title">Synthesized OpenAPI 3.1 + TypeScript</h3>
          <button class="copy-btn output-label" onclick="copyOutput('synth-output')">⎘ copy</button>
        </div>
        <div class="panel-body">
          <pre id="synth-output" class="output idle">// OpenAPI 3.1 spec and TypeScript interface will be generated here…</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- ── TAB: ABOUT ── -->
  <div id="pane-about" class="pane">
    <div class="cards">
      <div class="card">
        <div class="card-icon">🔬</div>
        <h4>Zero-Copy Binary Parsing</h4>
        <p>Every byte range is decoded via typed <code>Buffer.subarray</code> views — no string slicing, no allocations until a field is fully validated.</p>
      </div>
      <div class="card">
        <div class="card-icon">🛡</div>
        <h4>Never Throws</h4>
        <p>All decoders return <code>Result&lt;T, ParseError&gt;</code>. Arbitrary fuzz input returns a structured error with byte offset and field name — zero uncaught exceptions.</p>
      </div>
      <div class="card">
        <div class="card-icon">🧪</div>
        <h4>Property-Based Tested</h4>
        <p>Round-trip invariant and fuzz invariant verified with <code>fast-check</code> at 1000 iterations each — for both EBCDIC/COMP‑3 and ISO‑8583.</p>
      </div>
      <div class="card">
        <div class="card-icon">🤖</div>
        <h4>MCP-Native Tools</h4>
        <p>Three Kiro MCP tools: <code>inspect_iso8583_stream</code>, <code>inspect_ebcdic_stream</code>, and <code>synthesize_microservice</code> — callable directly from Kiro chat.</p>
      </div>
      <div class="card">
        <div class="card-icon">📐</div>
        <h4>Spec-Driven with Kiro</h4>
        <p>Every codec, test, and synthesis rule was driven by a Kiro spec — requirements, design, and task waves tracked end-to-end in <code>/.kiro/specs</code>.</p>
      </div>
      <div class="card">
        <div class="card-icon">🔄</div>
        <h4>Resurrection Category</h4>
        <p>EBCDIC was born in 1964. ISO‑8583 in 1987. AuraGate resurrects them into a modern OpenAPI 3.1 + TypeScript microservice pipeline — no manual mapping required.</p>
      </div>
    </div>

    <div class="arch">
      <h3>Pipeline Architecture</h3>
      <div class="arch-flow">
        <div class="arch-node">
          <div class="node-type">INPUT</div>
          <div class="node-name">Raw Hex / Binary</div>
        </div>
        <div class="arch-arrow">→</div>
        <div class="arch-node highlight">
          <div class="node-type">src/core/</div>
          <div class="node-name">ebcdic.ts</div>
        </div>
        <div class="arch-arrow">→</div>
        <div class="arch-node highlight">
          <div class="node-type">src/core/</div>
          <div class="node-name">iso8583.ts</div>
        </div>
        <div class="arch-arrow">→</div>
        <div class="arch-node highlight">
          <div class="node-type">src/core/</div>
          <div class="node-name">synthesizer.ts</div>
        </div>
        <div class="arch-arrow">→</div>
        <div class="arch-node">
          <div class="node-type">OUTPUT</div>
          <div class="node-name">OpenAPI 3.1 + TS</div>
        </div>
      </div>
      <div class="arch-flow" style="margin-top:12px;">
        <div class="arch-node">
          <div class="node-type">src/mcp/</div>
          <div class="node-name">MCP Server</div>
        </div>
        <div class="arch-arrow">↔</div>
        <div class="arch-node highlight">
          <div class="node-type">Kiro IDE</div>
          <div class="node-name">Agent Chat</div>
        </div>
        <div class="arch-arrow">↔</div>
        <div class="arch-node">
          <div class="node-type">REST API</div>
          <div class="node-name">src/server.ts</div>
        </div>
      </div>
    </div>
  </div>

</div><!-- /main -->

<footer>
  Built for <a href="https://kiroween-2025.devpost.com/" target="_blank">Kiroween 2026 Hackathon</a>
  · Category: <strong>Resurrection</strong>
  · By Oyetunde Daniel
  · Powered by <a href="https://kiro.dev" target="_blank">Kiro</a>
</footer>

<script>
  const SAMPLE_ISO     = '${sampleIso}';
  const SAMPLE_EBCDIC  = '${fullEbcdicSample}';
  const COMP3_OFFSET   = ${sampleComp3Offset};
  const COMP3_LENGTH   = 4;

  function switchTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('pane-' + id).classList.add('active');
  }

  function loadSample(type) {
    if (type === 'iso') {
      document.getElementById('iso-payload').value = SAMPLE_ISO;
    } else if (type === 'ebcdic') {
      document.getElementById('ebcdic-payload').value = SAMPLE_EBCDIC;
      document.getElementById('ebcdic-offset').value  = COMP3_OFFSET;
      document.getElementById('ebcdic-length').value  = COMP3_LENGTH;
    } else if (type === 'synth') {
      document.getElementById('synth-payload').value = SAMPLE_ISO;
      document.getElementById('synth-name').value    = 'PaymentSwitchV1';
    }
  }

  function clearPane(type) {
    if (type === 'iso') {
      document.getElementById('iso-payload').value = '';
      setOutput('iso-output', '// Cleared.', 'idle');
    } else if (type === 'ebcdic') {
      document.getElementById('ebcdic-payload').value = '';
      setOutput('ebcdic-output', '// Cleared.', 'idle');
    } else if (type === 'synth') {
      document.getElementById('synth-payload').value = '';
      setOutput('synth-output', '// Cleared.', 'idle');
    }
  }

  function setOutput(id, text, state = '') {
    const el = document.getElementById(id);
    el.className = 'output' + (state ? ' ' + state : '');
    el.textContent = text;
  }

  function copyOutput(id) {
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  async function unpackIso() {
    const payload = document.getElementById('iso-payload').value.trim();
    if (!payload) { setOutput('iso-output', '⚠ Please enter a hex payload.', 'error'); return; }
    setOutput('iso-output', '⏳ De-serializing wire byte buffer…', 'idle');
    try {
      const res  = await fetch('/api/v1/bridge/iso8583', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });
      const data = await res.json();
      setOutput('iso-output', JSON.stringify(data, null, 2), res.ok ? '' : 'error');
    } catch(e) {
      setOutput('iso-output', '✖ Network error: ' + e.message, 'error');
    }
  }

  async function decodeEbcdic() {
    const payload = document.getElementById('ebcdic-payload').value.trim();
    if (!payload) { setOutput('ebcdic-output', '⚠ Please enter a hex payload.', 'error'); return; }
    const offsetVal = document.getElementById('ebcdic-offset').value;
    const lengthVal = document.getElementById('ebcdic-length').value;
    const body = { payload };
    if (offsetVal !== '' && lengthVal !== '') {
      body.comp3Offset = parseInt(offsetVal, 10);
      body.comp3Length = parseInt(lengthVal, 10);
    }
    setOutput('ebcdic-output', '⏳ Decoding EBCDIC buffer…', 'idle');
    try {
      const res  = await fetch('/api/v1/bridge/ebcdic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setOutput('ebcdic-output', JSON.stringify(data, null, 2), res.ok ? '' : 'error');
    } catch(e) {
      setOutput('ebcdic-output', '✖ Network error: ' + e.message, 'error');
    }
  }

  async function synthesizeApi() {
    const payload     = document.getElementById('synth-payload').value.trim();
    const serviceName = document.getElementById('synth-name').value.trim() || 'AuraGateBridge';
    if (!payload) { setOutput('synth-output', '⚠ Please enter a hex payload.', 'error'); return; }
    setOutput('synth-output', '⏳ Synthesizing OpenAPI 3.1 specification…', 'idle');
    try {
      const res  = await fetch('/api/v1/bridge/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, serviceName })
      });
      const data = await res.json();
      setOutput('synth-output', JSON.stringify(data, null, 2), res.ok ? '' : 'error');
    } catch(e) {
      setOutput('synth-output', '✖ Network error: ' + e.message, 'error');
    }
  }

  // Auto-load the ISO sample on page load for instant wow-factor
  window.addEventListener('DOMContentLoaded', () => loadSample('iso'));
</script>
</body>
</html>`;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`[AuraGate] Gateway active on http://localhost:${PORT}`);
});
