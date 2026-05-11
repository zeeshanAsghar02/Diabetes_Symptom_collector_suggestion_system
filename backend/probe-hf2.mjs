const base = 'https://zeeshanasghar02-diabetica-api.hf.space';

// Try all known Gradio API patterns
const candidates = [
  // Gradio 3 style
  ['POST', '/api/predict',    { data: ['sys', 'hello', 100, 0.3], fn_index: 0, session_hash: 'abc123' }],
  // Gradio 4 named endpoints  
  ['POST', '/call/generate',  { data: ['sys', 'hello', 100, 0.3] }],
  ['POST', '/call/predict',   { data: ['sys', 'hello', 100, 0.3] }],
  ['POST', '/call/chat',      { data: ['sys', 'hello', 100, 0.3] }],
  ['POST', '/call/infer',     { data: ['sys', 'hello', 100, 0.3] }],
  // Custom FastAPI / v1 style
  ['POST', '/generate',       { system_prompt: 'sys', user_message: 'hello', max_tokens: 100, temperature: 0.3 }],
  ['POST', '/v1/generate',    { system_prompt: 'sys', user_message: 'hello', max_tokens: 100, temperature: 0.3 }],
  ['POST', '/v1/chat/completions', { model: 'diabetica', messages: [{role:'user', content:'hello'}], max_tokens: 50 }],
  // Gradio info endpoints
  ['GET',  '/api/',           null],
  ['GET',  '/api/queue/status', null],
];

for (const [method, path, body] of candidates) {
  try {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    const text = (await res.text()).slice(0, 200);
    console.log(`${res.status} | ${method} ${path}`);
    if (res.status !== 404) console.log(`       >> ${text}`);
  } catch (e) {
    console.log(`ERR   | ${method} ${path} -> ${e.message}`);
  }
}
