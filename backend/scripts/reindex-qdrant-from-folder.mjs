import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { calculateChecksum, extractText, chunkText, getFileExtension, isValidFileType } from '../services/documentService.js';
import { generateEmbeddingsBatch, initializeEmbeddingModel } from '../services/embeddingService.js';
import { hasAnyPointForDocument, initializeQdrantDB, upsertChunks } from '../services/qdrantService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {
    dir: null,
    chunkSize: process.env.CHUNK_SIZE ? Number(process.env.CHUNK_SIZE) : 350,
    overlap: process.env.CHUNK_OVERLAP ? Number(process.env.CHUNK_OVERLAP) : 80,
    batchSize: 10,
    dryRun: false,
    limitFiles: null,
    skipExisting: true,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') args.dir = argv[++i];
    else if (a === '--chunk-size') args.chunkSize = Number(argv[++i]);
    else if (a === '--overlap') args.overlap = Number(argv[++i]);
    else if (a === '--batch-size') args.batchSize = Number(argv[++i]);
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--limit-files') args.limitFiles = Number(argv[++i]);
    else if (a === '--no-skip-existing') args.skipExisting = false;
    else if (a === '--help' || a === '-h') {
      console.log(`\nReindex local documents into Qdrant\n\nUsage:\n  node backend/scripts/reindex-qdrant-from-folder.mjs --dir "../documents of diabetes"\n\nOptions:\n  --dir <path>          Folder to scan (required)\n  --chunk-size <n>      Chunk size in approx words (default: 350)\n  --overlap <n>         Chunk overlap in approx words (default: 80)\n  --batch-size <n>      Embedding batch size (default: 10)\n  --limit-files <n>     Only ingest first N files (for testing)\n  --dry-run             Parse + chunk but do not embed/upsert\n\nEnv required:\n  QDRANT_URL, QDRANT_API_KEY (Qdrant Cloud)\n  JINA_API_KEY (for embeddings)\n`);
      process.exit(0);
    }
  }

  return args;
}

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...walkFiles(full));
    else if (e.isFile()) results.push(full);
  }
  return results;
}

function normalizeDocType(filename) {
  const f = filename.toLowerCase();
  if (f.includes('diet') || f.includes('nutrition') || f.includes('exchange')) return 'diet_chart';
  if (f.includes('exercise') || f.includes('physical')) return 'exercise_recommendation';
  if (f.includes('guideline') || f.includes('standards') || f.includes('recommendation')) return 'guideline';
  if (f.includes('paper') || f.includes('piis') || f.includes('research')) return 'research_paper';
  return 'clinical_material';
}

async function ingestOneFile(filePath, opts) {
  const originalFilename = path.basename(filePath);
  if (!isValidFileType(originalFilename)) {
    return { status: 'skipped', reason: 'unsupported_type' };
  }

  const checksum = await calculateChecksum(filePath);
  const docId = checksum; // stable ID so re-runs upsert same points

  if (!opts.dryRun && opts.skipExisting) {
    const exists = await hasAnyPointForDocument(docId);
    if (exists) {
      return { status: 'skipped', reason: 'already_ingested', checksum, docId };
    }
  }

  const ext = getFileExtension(originalFilename);
  const { text, pageCount } = await extractText(filePath, ext);
  const chunks = chunkText(text, opts.chunkSize, opts.overlap);

  if (opts.dryRun) {
    return { status: 'dry_run', checksum, docId, pageCount, chunks: chunks.length };
  }

  const chunkTexts = chunks.map(c => c.text);
  const embeddings = await generateEmbeddingsBatch(chunkTexts, opts.batchSize);

  const nowIso = new Date().toISOString();
  const title = path.parse(originalFilename).name;
  const doc_type = normalizeDocType(originalFilename);

  const qdrantChunks = chunks.map((chunk, idx) => ({
    id: `${docId}_chunk_${chunk.index}`,
    text: chunk.text,
    embedding: embeddings[idx],
    metadata: {
      document_id: docId,
      documentId: docId,
      chunk_index: chunk.index,
      title,
      source: 'documents-of-diabetes',
      country: 'Global',
      doc_type,
      version: '1.0',
      original_filename: originalFilename,
      checksum,
      ingested_on: nowIso,
      page_no: pageCount ? Math.floor(chunk.index / (chunks.length / pageCount)) + 1 : null,
    },
  }));

  await upsertChunks(qdrantChunks);
  return { status: 'ingested', checksum, docId, pageCount, chunks: chunks.length };
}

async function main() {
  const opts = parseArgs(process.argv);
  const defaultDir = path.resolve(__dirname, '..', '..', 'documents of diabetes');
  const dir = path.resolve(process.cwd(), opts.dir || defaultDir);

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  console.log(`Reindexing documents from: ${dir}`);
  console.log(`Options: chunkSize=${opts.chunkSize}, overlap=${opts.overlap}, batchSize=${opts.batchSize}, dryRun=${opts.dryRun}`);

  const allFiles = walkFiles(dir);
  const candidateFiles = allFiles.filter(f => isValidFileType(path.basename(f)));
  const files = typeof opts.limitFiles === 'number' ? candidateFiles.slice(0, opts.limitFiles) : candidateFiles;

  console.log(`Found ${candidateFiles.length} supported file(s).`);
  if (files.length !== candidateFiles.length) console.log(`Limiting to first ${files.length} file(s).`);

  if (!opts.dryRun) {
    await initializeEmbeddingModel();
    await initializeQdrantDB();
  }

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  let totalChunks = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const rel = path.relative(dir, f);
    console.log(`\n[${i + 1}/${files.length}] ${rel}`);
    try {
      const result = await ingestOneFile(f, opts);
      if (result.status === 'skipped') {
        skipped++;
        console.log(`  - skipped (${result.reason})`);
      } else {
        ok++;
        totalChunks += result.chunks || 0;
        console.log(`  - ${result.status}: chunks=${result.chunks}, pages=${result.pageCount}`);
      }
    } catch (e) {
      failed++;
      console.error(`  - failed: ${e.message}`);
      if (e.code === 'OCR_REQUIRED') {
        console.error('    (PDF is scanned / image-based; OCR required)');
      }
    }
  }

  console.log(`\nDone. ok=${ok}, skipped=${skipped}, failed=${failed}, totalChunks=${totalChunks}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
