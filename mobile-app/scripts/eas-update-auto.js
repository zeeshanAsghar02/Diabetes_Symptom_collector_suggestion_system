#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const branch = process.argv[2] || 'preview';
const checkOnly = process.argv.includes('--check-only');

const mobileRoot = process.cwd();
const repoRoot = path.dirname(mobileRoot);
const rulesPath = path.join(mobileRoot, 'scripts', 'eas-workflow-rules.json');

function run(cmd, args, cwd = mobileRoot) {
  return spawnSync(cmd, args, { cwd, encoding: 'utf8' });
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function wildcardToRegex(pattern) {
  const normalized = pattern.replace(/\\/g, '/');
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  let regex = '^';
  for (let i = 0; i < escaped.length; i++) {
    const ch = escaped[i];

    if (ch === '*') {
      const next = escaped[i + 1];
      if (next === '*') {
        regex += '.*';
        i++;
      } else {
        regex += '[^/]*';
      }
      continue;
    }

    regex += ch;
  }
  regex += '$';

  return new RegExp(regex);
}

function getLatestCommitMessage() {
  const out = run('git', ['log', '-1', '--pretty=%s'], repoRoot);
  if (out.status !== 0 || !out.stdout.trim()) {
    return 'OTA update';
  }
  return out.stdout.trim();
}

function getChangedFilesInHeadCommit() {
  const out = run('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'], repoRoot);
  if (out.status !== 0) {
    fail('Could not read changed files from latest commit. Commit your change first, then run again.');
  }
  return out.stdout
    .split(/\r?\n/)
    .map((s) => s.trim().replace(/\\/g, '/'))
    .filter(Boolean);
}

if (!fs.existsSync(rulesPath)) {
  fail(`Rules file not found at ${rulesPath}`);
}

let rules;
try {
  rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
} catch (err) {
  fail(`Invalid rules JSON: ${err.message}`);
}

const changedFiles = getChangedFilesInHeadCommit();
if (changedFiles.length === 0) {
  fail('No files changed in latest commit. Create a commit before publishing update.');
}

const blocked = [];
for (const rule of rules.requiresBuild || []) {
  const re = wildcardToRegex(rule.pattern);
  const matches = changedFiles.filter((f) => re.test(f));
  if (matches.length) {
    blocked.push({ reason: rule.reason, matches });
  }
}

if (blocked.length) {
  console.error('Build required: latest commit includes files that should not be shipped as OTA only.');
  for (const item of blocked) {
    console.error(`- ${item.reason}`);
    for (const file of item.matches) {
      console.error(`  * ${file}`);
    }
  }
  console.error('Run: npm run build:android:preview');
  process.exit(2);
}

console.log(`Latest commit files are OTA-safe for branch "${branch}".`);
if (checkOnly) {
  process.exit(0);
}

const message = getLatestCommitMessage();
console.log(`Publishing OTA update with message: ${message}`);

const updateArgs = ['eas-cli', 'update', '--branch', branch, '--message', message, '--non-interactive'];
const result = run('npx', updateArgs, mobileRoot);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status !== 0) {
  fail('OTA update failed. Fix the above error and retry.');
}

console.log('OTA update published successfully.');
