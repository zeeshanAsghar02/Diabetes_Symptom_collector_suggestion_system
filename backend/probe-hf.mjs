const base = 'https://zeeshanasghar02-diabetica-api.hf.space';

// Fetch root to discover API hints
const r = await fetch(base + '/', { signal: AbortSignal.timeout(10000) });
const text = await r.text();
const matches = text.match(/\/api[^\s"'<>]{0,80}|\/run[^\s"'<>]{0,60}|\/queue[^\s"'<>]{0,60}|fn_index|named_endpoints/g) || [];
console.log('Root page API hints:', [...new Set(matches)].slice(0, 30));

// Try Gradio 4 queue endpoints
const tests = [
  ['POST', '/queue/join',   { data: ['sys', 'usr', 50, 0.3], fn_index: 0, session_hash: 'test123' }],
  ['POST', '/queue/data',   null],
  ['GET',  '/queue/status', null],
  ['POST', '/api/queue/join', { data: ['sys', 'usr', 50, 0.3], fn_index: 0 }],
];

for (const [method, path, body] of tests) {
  try {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    const preview = (await res.text()).slice(0, 120);
    console.log(`${method} ${path} -> ${res.status} | ${preview}`);
  } catch (e) {
    console.log(`${method} ${path} -> ERROR: ${e.message}`);
  }
}
