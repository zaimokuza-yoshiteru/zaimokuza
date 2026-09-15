import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function toolOutput(text: string, directory: string, previewChars = 32) {
  const characters = [...text];
  if (characters.length <= previewChars) return { preview: text, artifact: null, truncated: false };
  const name = createHash('sha256').update(text).digest('hex').slice(0, 16) + '.txt';
  // 先写入成功，才能向模型承诺存在可回读的原文。
  writeFileSync(join(directory, name), text, 'utf8');
  return { preview: characters.slice(0, previewChars).join(''), artifact: name, truncated: true };
}

const directory = mkdtempSync(join(tmpdir(), 'context-demo-'));
try {
  const result = toolOutput('connection timeout\n'.repeat(10), directory);
  assert.ok(result.truncated && result.artifact);
  assert.equal(readFileSync(join(directory, result.artifact), 'utf8'), 'connection timeout\n'.repeat(10));
  // 自定义中间表示；适配器仍需转换成供应商的真实图片内容块。
  const blocks = [{ kind: 'text', text: result.preview }, { kind: 'image', source: 'screenshot.png' }];
  assert.equal(blocks[1].kind, 'image');
  console.log(JSON.stringify({ preview_length: [...result.preview].length, kinds: blocks.map(b => b.kind) }));
} finally { rmSync(directory, { recursive: true, force: true }); }
