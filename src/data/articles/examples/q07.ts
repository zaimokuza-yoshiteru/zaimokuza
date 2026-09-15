import assert from 'node:assert/strict';

type RecordInfo = { id: string; last_used_day: number; active: boolean };
function cleanupPlan(records: RecordInfo[], referencedIds: Set<string>, cutoffDay: number) {
  // 这里只规划；活跃记录和摘要仍引用的原文不能因过期被删。
  return records.filter(r => r.last_used_day < cutoffDay && !r.active && !referencedIds.has(r.id))
    .map(r => r.id);
}

const records = [
  { id: 'old', last_used_day: 10, active: false },
  { id: 'evidence', last_used_day: 10, active: false },
  { id: 'live', last_used_day: 10, active: true },
  { id: 'recent', last_used_day: 90, active: false },
];
const plan = cleanupPlan(records, new Set(['evidence']), 70);
assert.deepEqual(plan, ['old']);
assert.equal(records.length, 4);
console.log(JSON.stringify({ delete_candidates: plan }));
