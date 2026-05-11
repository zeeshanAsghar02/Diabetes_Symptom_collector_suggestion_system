/**
 * test-hf-dietplan.mjs
 * ---------------------
 * Quick smoke-test for HF Gradio API used in dietPlanService & monthlyDietPlanService.
 * Run from /backend:  node test-hf-dietplan.mjs
 *
 * Tests:
 *   1. Raw Gradio round-trip (minimal prompt)
 *   2. Daily diet-plan prompt (JSON parsing)
 *   3. Monthly diet-plan week prompt (JSON parsing)
 */

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const HF_BASE = process.env.HF_SPACE_URL || 'https://zeeshanasghar02-diabetica-api.hf.space';
// Gradio slider constraint: max_tokens must be 256–2048
const rawTokens = parseInt(process.env.LM_STUDIO_MAX_TOKENS || '2048');
const MAX_TOKENS = Math.min(Math.max(rawTokens, 256), 2048);

// ─────────────────────────────────────────────────────────────
//  Core helper: mirrors callDiabetica from the services
// ─────────────────────────────────────────────────────────────
async function callDiabetica(systemPrompt, userPrompt, maxTokens = 512, temperature = 0.85) {
  console.log(`\n📡  POST ${HF_BASE}/gradio_api/call/predict`);

  const submitRes = await axios.post(
    `${HF_BASE}/gradio_api/call/predict`,
    { data: [systemPrompt, userPrompt, maxTokens, temperature] },
    { timeout: 30_000 }
  );
  const { event_id } = submitRes.data;
  if (!event_id) throw new Error('No event_id returned from Gradio');
  console.log(`✅  event_id = ${event_id}  — polling SSE...`);

  const sseRes = await axios.get(
    `${HF_BASE}/gradio_api/call/predict/${event_id}`,
    { timeout: 300_000, responseType: 'text' }
  );

  const raw = sseRes.data;
  console.log(`\n📄  Raw SSE (first 800 chars):\n${raw.substring(0, 800)}\n`);

  // Scan backwards for last `data:` line
  const lines = raw.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('data:')) {
      try {
        const json = JSON.parse(line.slice(5).trim());
        if (Array.isArray(json) && typeof json[0] === 'string') return json[0];
        if (Array.isArray(json) && Array.isArray(json[0])) return json[0][0];
        if (json?.output?.data?.[0]) return json.output.data[0];
      } catch { /* keep scanning */ }
    }
  }
  throw new Error(`Could not parse SSE. Full raw:\n${raw}`);
}

// ─────────────────────────────────────────────────────────────
//  Test 1 — Raw ping with tiny prompt
// ─────────────────────────────────────────────────────────────
async function test1_rawPing() {
  console.log('\n══════════════════════════════════════════');
  console.log(' TEST 1 — Raw Gradio ping (echo JSON)');
  console.log('══════════════════════════════════════════');

  const sys = 'You are a helpful assistant. Reply with valid JSON only.';
  const usr = 'Return this exact JSON: {"status":"ok","message":"Diabetica is alive"}';

  const result = await callDiabetica(sys, usr, 256, 0.1);  // 256 = Gradio slider minimum
  console.log('✅  Parsed output:', result);
  return result;
}

// ─────────────────────────────────────────────────────────────
//  Test 2 — Daily diet plan prompt (same as dietPlanService)
// ─────────────────────────────────────────────────────────────
async function test2_dailyDietPlan() {
  console.log('\n══════════════════════════════════════════');
  console.log(' TEST 2 — Daily Diet Plan JSON generation');
  console.log('══════════════════════════════════════════');

  const systemPrompt = `You are a specialized diabetes dietitian AI.
CRITICAL RESPONSE RULES:
1. Respond with ONLY valid JSON — no markdown, no code blocks, no explanations
2. Each meal's "items" field MUST be an array of food objects
3. Each food item MUST have: "food" (string), "portion" (string), "calories" (number), "carbs" (number), "protein" (number), "fat" (number), "fiber" (number)
4. Put all advice in the "tips" array ONLY`;

  const userPrompt = `Create a 1-day diabetic meal plan for:
- Patient type: Type 2 Diabetes
- Calories: 1800
- Region: Pakistan
- Meals: breakfast, lunch, dinner, morning_snack, evening_snack
Respond ONLY with this JSON structure:
{
  "breakfast": { "items": [ { "food":"...", "portion":"...", "calories":0, "carbs":0, "protein":0, "fat":0, "fiber":0 } ], "total_calories":0 },
  "morning_snack": { "items": [...], "total_calories":0 },
  "lunch": { "items": [...], "total_calories":0 },
  "evening_snack": { "items": [...], "total_calories":0 },
  "dinner": { "items": [...], "total_calories":0 },
  "tips": ["string tip 1", "string tip 2"]
}`;

  const result = await callDiabetica(systemPrompt, userPrompt, 2048, 0.85);
  console.log('\n📋  Raw AI text (first 1000 chars):');
  console.log(result.substring(0, 1000));

  // Try parsing JSON
  const cleaned = result.replace(/```json|```/g, '').trim();
  let jsonStart = cleaned.indexOf('{');
  let jsonEnd   = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      console.log('\n✅  JSON parsed successfully! Top-level keys:', Object.keys(parsed));
      if (parsed.breakfast?.items?.length) {
        console.log(`   breakfast has ${parsed.breakfast.items.length} items, first food: "${parsed.breakfast.items[0]?.food}"`);
      }
      if (parsed.tips?.length) {
        console.log(`   tips[0]: "${parsed.tips[0]}"`);
      }
      return { ok: true, parsed };
    } catch (e) {
      console.error('❌  JSON.parse failed:', e.message);
      console.log('   Attempted to parse:', jsonStr.substring(0, 300));
      return { ok: false, raw: result };
    }
  } else {
    console.error('❌  No JSON object found in response');
    console.log('   Full response:', result);
    return { ok: false, raw: result };
  }
}

// ─────────────────────────────────────────────────────────────
//  Helper: build the exact same prompt as _callForMealGroup
// ─────────────────────────────────────────────────────────────
function buildGroupPrompt(mealKeys, mealDist, region, optionsPerMeal = 2) {
  const mealNames = {
    breakfast: 'Breakfast', mid_morning_snack: 'Mid-Morning Snack',
    lunch: 'Lunch', evening_snack: 'Evening Snack', dinner: 'Dinner',
  };
  const calTargets = mealKeys.map(k => `${k}=${mealDist[k]} kcal`).join(', ');
  const skeleton = '{' + mealKeys.map(k =>
    `\n  "${k}": [\n    ${Array.from({length: optionsPerMeal}, (_, i) =>
      `{"option_name":"Option ${i+1}","description":"Short description max 8 words","preparation_time":"10 min","difficulty":"Easy","items":[{"food":"name","portion":"amount","calories":100,"carbs":15,"protein":5,"fat":3,"fiber":2}]}`
    ).join(',\n    ')}\n  ]`
  ).join(',') + '\n}';

  return `You are a diabetes dietitian. Create ${optionsPerMeal} option${optionsPerMeal > 1 ? 's' : ''} for each meal: ${mealKeys.map(k => mealNames[k]).join(', ')}.

PATIENT: Age 45, Male, Region: ${region}, Type 2, Diet: Non-Vegetarian
CALORIE TARGETS: ${calTargets}

REGIONAL FOODS (${region}):
[1] Pakistani diet: roti, dal, rice, chicken karahi
[2] Diabetic Pakistani foods: whole wheat roti, brown rice, grilled chicken
[3] Low glycemic snacks: nuts, roasted chana, fruit chaat

RULES:
- description: max 8 words
- All nutritional values MUST be plain numbers (no units like g, mg)
- 2-3 items per option

Return ONLY valid JSON — no markdown, no extra text:
${skeleton}`;
}

function parseMealGroup(aiResponse, mealKeys) {
  let cleaned = aiResponse.trim().replace(/```json|```/g, '');
  // Fix model outputting unit suffixes: "carbs": 25g → "carbs": 25
  cleaned = cleaned.replace(/:\s*(\d+(?:\.\d+)?)[a-zA-Z]+(?=[,\s}\]])/g, ': $1');
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object');
  const parsed = JSON.parse(cleaned.substring(start, end + 1));
  const found  = mealKeys.filter(k => Array.isArray(parsed[k]) && parsed[k].length > 0);
  return { parsed, found };
}

// ─────────────────────────────────────────────────────────────
//  Test 3 — Main meals call (breakfast, lunch, dinner)
// ─────────────────────────────────────────────────────────────
async function test3_mainMeals() {
  console.log('\n══════════════════════════════════════════');
  console.log(' TEST 3 — Monthly plan: main meals (1 option each)');
  console.log('══════════════════════════════════════════');

  const mealKeys = ['breakfast', 'lunch', 'dinner'];
  const mealDist = { breakfast: 450, lunch: 540, dinner: 510 };
  const sys = 'You are a diabetes nutrition expert AI. Respond with ONLY valid JSON — no markdown, no code blocks.';
  const usr = buildGroupPrompt(mealKeys, mealDist, 'Pakistan', 1);  // 1 option per meal

  const result = await callDiabetica(sys, usr, 2048, 0.9);
  console.log('\n📋  Raw AI text (first 1000 chars):');
  console.log(result.substring(0, 1000));

  const { parsed, found } = parseMealGroup(result, mealKeys);
  console.log(`\n✅  JSON parsed! Keys present: ${found.join(', ')}`);
  found.forEach(k => console.log(`   ${k}: ${parsed[k].length} options, first="${parsed[k][0]?.option_name}"`));
  const allPresent = mealKeys.every(k => found.includes(k));
  if (!allPresent) console.warn('   ⚠️  Missing keys:', mealKeys.filter(k => !found.includes(k)));
  return { ok: allPresent };
}

// ─────────────────────────────────────────────────────────────
//  Test 3b — Snacks call (mid_morning_snack, evening_snack)
// ─────────────────────────────────────────────────────────────
async function test3b_snacks() {
  console.log('\n══════════════════════════════════════════');
  console.log(' TEST 3b — Monthly plan: snacks call');
  console.log('══════════════════════════════════════════');

  const mealKeys = ['mid_morning_snack', 'evening_snack'];
  const mealDist = { mid_morning_snack: 150, evening_snack: 150 };
  const sys = 'You are a diabetes nutrition expert AI. Respond with ONLY valid JSON — no markdown, no code blocks.';
  const usr = buildGroupPrompt(mealKeys, mealDist, 'Pakistan');

  const result = await callDiabetica(sys, usr, 2048, 0.9);
  console.log('\n📋  Raw AI text (first 600 chars):');
  console.log(result.substring(0, 600));

  const { parsed, found } = parseMealGroup(result, mealKeys);
  console.log(`\n✅  JSON parsed! Keys present: ${found.join(', ')}`);
  found.forEach(k => console.log(`   ${k}: ${parsed[k].length} options, first="${parsed[k][0]?.option_name}"`));
  const allPresent = mealKeys.every(k => found.includes(k));
  if (!allPresent) console.warn('   ⚠️  Missing keys:', mealKeys.filter(k => !found.includes(k)));
  return { ok: allPresent };
}

// ─────────────────────────────────────────────────────────────
//  Runner
// ─────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n🔬  HF Gradio Diet Plan Test`);
  console.log(`   HF Base : ${HF_BASE}`);
  console.log(`   Max Tok : ${MAX_TOKENS}`);

  const results = { test1: false, test2: false, test3: false, test3b: false };

  try {
    await test1_rawPing();
    results.test1 = true;
  } catch (e) {
    console.error('\n❌  TEST 1 FAILED:', e.message);
  }

  try {
    const r = await test2_dailyDietPlan();
    results.test2 = r?.ok ?? false;
  } catch (e) {
    console.error('\n❌  TEST 2 FAILED:', e.message);
  }

  try {
    const r = await test3_mainMeals();
    results.test3 = r?.ok ?? false;
  } catch (e) {
    console.error('\n❌  TEST 3 FAILED:', e.message);
  }

  try {
    const r = await test3b_snacks();
    results.test3b = r?.ok ?? false;
  } catch (e) {
    console.error('\n❌  TEST 3b FAILED:', e.message);
  }

  console.log('\n══════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════════');
  console.log(`  Test 1  (Raw ping)         : ${results.test1  ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Test 2  (Daily diet)        : ${results.test2  ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Test 3  (Main meals)        : ${results.test3  ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Test 3b (Snacks)            : ${results.test3b ? '✅ PASS' : '❌ FAIL'}`);
  console.log('══════════════════════════════════════════\n');
})();
