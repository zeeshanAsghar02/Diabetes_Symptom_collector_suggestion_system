/**
 * Diagnostic script — probe Qdrant directly.
 * Creates payload indexes first (required for filtering), then validates Pakistan diet doc queries.
 *
 * Run: node probe-qdrant.mjs
 */
import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION = 'diabetes_docs';
const URL  = process.env.QDRANT_URL;
const KEY  = process.env.QDRANT_API_KEY;

if (!URL) {
  throw new Error('QDRANT_URL is not set. Create a new cluster at https://cloud.qdrant.io and set QDRANT_URL + QDRANT_API_KEY');
}

const client = new QdrantClient({ url: URL, apiKey: KEY });

async function ensureIndexes() {
  const fields = ['country', 'doc_type', 'document_id', 'title', 'source'];
  console.log('--- Ensuring payload indexes ---');
  for (const field of fields) {
    try {
      await client.createPayloadIndex(COLLECTION, { field_name: field, field_schema: 'keyword', wait: true });
      console.log(`  ✅  index created: "${field}"`);
    } catch (e) {
      if (e.status === 400 || e.message?.includes('already exists')) {
        console.log(`  ✅  index already exists: "${field}"`);
      } else {
        console.warn(`  ⚠️   index error for "${field}":`, e.message);
      }
    }
  }
}

async function main() {
  console.log('\n====== QDRANT DIAGNOSTIC ======\n');

  const info = await client.getCollection(COLLECTION);
  console.log(`Collection: ${COLLECTION}`);
  console.log(`  Total points : ${info.points_count}`);
  console.log(`  Status       : ${info.status}`);

  if (info.points_count === 0) {
    console.log('\n❌  Collection is EMPTY — no documents ingested!');
    return;
  }

  // Step 1: Create indexes first (Qdrant REQUIRES these for filtering)
  await ensureIndexes();

  // Step 2: Scroll ALL metadata (no filter — always works)
  console.log('\n--- Metadata audit (all points) ---');
  const countries = new Map();
  const docTypes  = new Map();
  let offset = null;
  let total  = 0;

  do {
    const params = { limit: 250, with_payload: true, with_vector: false };
    if (offset !== null) params.offset = offset;
    const page = await client.scroll(COLLECTION, params);
    offset = page.next_page_offset ?? null;
    for (const pt of page.points || []) {
      const pl = pt.payload || {};
      countries.set(pl.country  ?? '(null)', (countries.get(pl.country  ?? '(null)') || 0) + 1);
      docTypes .set(pl.doc_type ?? '(null)', (docTypes .get(pl.doc_type ?? '(null)') || 0) + 1);
      total++;
    }
  } while (offset !== null && offset !== undefined);

  console.log(`\nScrolled ${total} total points`);
  console.log('\n📍 Unique countries:');
  [...countries.entries()].sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`   "${k}" → ${v} chunks`));
  console.log('\n📄 Unique doc_types:');
  [...docTypes.entries()].sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`   "${k}" → ${v} chunks`));

  // Step 3: Filtered scroll — Pakistan diet
  console.log('\n--- Filtered scroll: country=Pakistan, doc_type in [diet_chart, guideline] ---');
  const fp = await client.scroll(COLLECTION, {
    limit: 5,
    with_payload: true,
    with_vector: false,
    filter: {
      must: [
        { key: 'country',  match: { value: 'Pakistan' } },
        { key: 'doc_type', match: { any: ['diet_chart', 'guideline'] } }
      ]
    }
  });
  const fpts = fp.points || [];
  if (fpts.length === 0) {
    console.log('❌  0 results — no Pakistan diet/guideline docs found');
  } else {
    console.log(`✅  ${fpts.length} Pakistan diet chunks found (filter works):`);
    fpts.forEach((pt, i) => {
      const p = pt.payload || {};
      console.log(`\n  [${i+1}] country="${p.country}" | doc_type="${p.doc_type}" | title="${p.title}"`);
      console.log(`       text[:120]: "${(p.text||'').substring(0,120)}"`);
    });
  }

  // Breakdown counts
  const dcpts = await client.scroll(COLLECTION, { limit: 200, with_payload: false, with_vector: false, filter: { must: [{ key: 'country', match: { value: 'Pakistan' } }, { key: 'doc_type', match: { value: 'diet_chart' } }] } });
  const gdpts = await client.scroll(COLLECTION, { limit: 200, with_payload: false, with_vector: false, filter: { must: [{ key: 'country', match: { value: 'Pakistan' } }, { key: 'doc_type', match: { value: 'guideline' } }] } });
  console.log(`\n  Pakistan + diet_chart: ${(dcpts.points||[]).length} chunks`);
  console.log(`  Pakistan + guideline : ${(gdpts.points||[]).length} chunks`);

  // Step 4: Sample any 3 points 
  console.log('\n--- Sample 3 points (any type) ---');
  const sample = await client.scroll(COLLECTION, { limit: 3, with_payload: true, with_vector: false });
  (sample.points||[]).forEach((pt, i) => {
    const p = pt.payload || {};
    console.log(`\n  [${i+1}] id=${pt.id} | country="${p.country}" | doc_type="${p.doc_type}" | title="${p.title}"`);
    console.log(`       payload keys: ${Object.keys(p).join(', ')}`);
  });

  console.log('\n====== DONE ======\n');
}

main().catch(err => {
  console.error('\nFatal error:', err?.data?.status?.error || err.message || err);
  process.exit(1);
});
