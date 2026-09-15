import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');
try {
  db.exec('CREATE VIRTUAL TABLE history USING fts5(id UNINDEXED, text)');
  const insert = db.prepare('INSERT INTO history VALUES (?, ?)');
  insert.run('t1', 'login succeeds after restart');
  insert.run('t2', 'database connection timeout after 30 seconds');
  insert.run('t3', 'image upload format mismatch');
  // FTS5 的 bm25 分数越小越靠前；这不是向量相似度。
  const hits = db.prepare(
    'SELECT id FROM history WHERE history MATCH ? ORDER BY bm25(history) LIMIT 2'
  ).all('"timeout"');
  assert.deepEqual(hits.map(row => row.id), ['t2']);
  const row = db.prepare('SELECT text FROM history WHERE id = ?').get(String(hits[0].id))!;
  const original = String(row.text);
  assert.ok(original.includes('30 seconds'));
  console.log(JSON.stringify({ ids: hits.map(row => row.id), original }));
} finally { db.close(); }
