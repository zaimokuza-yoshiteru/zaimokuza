import assert from 'node:assert/strict';
import { mkdtempSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function commit(directory: string, state: object, failBeforeReplace = false) {
  const pending = join(directory, 'context.pending');
  const fd = openSync(pending, 'w');
  try { writeFileSync(fd, JSON.stringify(state)); fsyncSync(fd); }
  finally { closeSync(fd); }
  try {
    if (failBeforeReplace) throw new Error('模拟提交前中断');
    renameSync(pending, join(directory, 'context.json')); // 同文件系统、单写者。
  } finally { rmSync(pending, { force: true }); }
}

const directory = mkdtempSync(join(tmpdir(), 'context-demo-'));
try {
  commit(directory, { version: 1, summary: 'old' });
  assert.throws(() => commit(directory, { version: 2, summary: 'new' }, true));
  const recovered = JSON.parse(readFileSync(join(directory, 'context.json'), 'utf8'));
  assert.equal(recovered.version, 1);
  console.log(JSON.stringify({ recovered_version: recovered.version }));
} finally { rmSync(directory, { recursive: true, force: true }); }
