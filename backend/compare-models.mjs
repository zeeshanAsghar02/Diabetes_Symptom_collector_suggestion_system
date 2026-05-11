/**
 * Model Comparison Script
 * Sends the same diabetes risk assessment prompt to:
 *   1. Hosted Diabetica-7B on Hugging Face (GGUF via llama-cpp-python)
 *   2. Local Diabetica-7B via LM Studio (OpenAI-compatible API)
 * Then prints a side-by-side comparison.
 */

const HF_BASE      = 'https://zeeshanasghar02-diabetica-api.hf.space';
const LM_BASE      = 'http://127.0.0.1:1234';
const LM_MODEL     = 'diabetica-7b';
const MAX_TOKENS   = 512;

const SYSTEM_PROMPT = `You are Diabetica, an expert AI medical assistant specializing in diabetes risk assessment. Provide concise, evidence-based assessments.`;

const SCENARIOS = [
  {
    label: 'Scenario 1 — HIGH risk, classic symptoms, male 45',
    prompt: `# Diabetes Risk Assessment Validation
## Patient Profile
- Age: 45, Gender: Male, Status: Undiagnosed
## XGBoost Result: HIGH risk, 82% probability, confidence 0.82
## Symptoms (4/14): Frequent urination (0.21), Excessive thirst (0.18), Sudden weight loss (0.14), Blurred vision (0.11)
## Task: In 3-4 sentences, do you agree with HIGH risk? Give one key recommendation.`
  },
  {
    label: 'Scenario 2 — LOW risk, borderline, female 28',
    prompt: `# Diabetes Risk Assessment Validation
## Patient Profile
- Age: 28, Gender: Female, Status: Undiagnosed
## XGBoost Result: LOW risk, 22% probability, confidence 0.71
## Symptoms (1/14): Mild fatigue (0.09)
## Task: In 3-4 sentences, do you agree with LOW risk? Should any follow-up be advised?`
  },
  {
    label: 'Scenario 3 — MODERATE risk, obesity + partial symptoms, male 58',
    prompt: `# Diabetes Risk Assessment Validation
## Patient Profile
- Age: 58, Gender: Male, Status: Undiagnosed, BMI: Obese
## XGBoost Result: MODERATE risk, 54% probability, confidence 0.63
## Symptoms (3/14): Obesity (0.19), Itching (0.08), Delayed wound healing (0.12)
## Task: In 3-4 sentences, evaluate this MODERATE classification. Is obesity alone sufficient for escalation to HIGH? Give one recommendation.`
  }
];

// Use first scenario as default for the banner, run all 3 below
const USER_PROMPT = SCENARIOS[0].prompt;

// ─── Utility ──────────────────────────────────────────────────────────────────
const separator = (label) => {
  const line = '─'.repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${label}`);
  console.log(line);
};

const timeIt = async (label, fn) => {
  const start = Date.now();
  try {
    const result = await fn();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { success: true, text: result, time: elapsed };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { success: false, text: err.message, time: elapsed };
  }
};

// ─── 1. Hugging Face (Gradio API) ─────────────────────────────────────────────
async function queryHuggingFace(prompt = USER_PROMPT) {
  const payload = { data: [SYSTEM_PROMPT, prompt, MAX_TOKENS, 0.3] };

  // Gradio 5 uses /gradio_api/ prefix for all API routes
  // POST /gradio_api/call/predict  → returns { event_id }
  // GET  /gradio_api/call/predict/{event_id} → SSE stream with result
  console.log('  [HF] Submitting to /gradio_api/call/predict ...');
  const queueRes = await fetch(`${HF_BASE}/gradio_api/call/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  console.log(`  [HF] submit status: ${queueRes.status}`);
  if (!queueRes.ok) {
    const body = await queueRes.text();
    throw new Error(`HF submit failed ${queueRes.status}: ${body.slice(0,200)}`);
  }

  const { event_id } = await queueRes.json();
  console.log(`  [HF] event_id: ${event_id}. Reading SSE stream (this takes 60-120s on CPU)...`);

  // SSE stream — Gradio 5 sends multiple events; last 'complete' has the output
  const sseRes = await fetch(`${HF_BASE}/gradio_api/call/predict/${event_id}`, {
    signal: AbortSignal.timeout(120_000),
  });
  if (!sseRes.ok) throw new Error(`SSE stream error: ${sseRes.status}`);

  const text = await sseRes.text();
  // SSE format: lines starting with 'data:' contain JSON
  // Look for the last 'complete' event which has the output array
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('data:')) {
      try {
        const json = JSON.parse(line.slice(5).trim());
        if (Array.isArray(json) && typeof json[0] === 'string') return json[0];
        if (json?.output?.data?.[0]) return json.output.data[0];
      } catch {}
    }
  }
  throw new Error(`Could not parse SSE response. Raw: ${text.slice(0, 500)}`)
}

// ─── 2. LM Studio (OpenAI-compatible) ─────────────────────────────────────────
async function queryLMStudio(prompt = USER_PROMPT) {
  const res = await fetch(`${LM_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: LM_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: prompt   },
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) throw new Error(`LM Studio returned ${res.status} — is LM Studio running?`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || 'No content in response';
}

// ─── Main ──────────────────────────────────────────────────────────────────────
console.log('\n🔬 Diabetica-7B Multi-Scenario Comparison');
console.log('   HF Cloud vs LM Studio — 3 clinical scenarios\n');

for (let i = 0; i < SCENARIOS.length; i++) {
  const scenario = SCENARIOS[i];
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  SCENARIO ${i + 1}: ${scenario.label}`);
  console.log(`${'═'.repeat(60)}`);
  console.log('⏳ Querying both models in parallel...\n');

  const [hfResult, lmResult] = await Promise.all([
    timeIt('Hugging Face', () => queryHuggingFace(scenario.prompt)),
    timeIt('LM Studio',    () => queryLMStudio(scenario.prompt)),
  ]);

  separator(`HF Cloud (${hfResult.time}s)`);
  console.log(hfResult.success ? hfResult.text : `❌ FAILED: ${hfResult.text}`);

  separator(`LM Studio (${lmResult.time}s)`);
  console.log(lmResult.success ? lmResult.text : `❌ FAILED: ${lmResult.text}`);
}

console.log(`\n${'═'.repeat(60)}`);
console.log('  DONE — All 3 scenarios complete');
console.log(`${'═'.repeat(60)}\n`);
