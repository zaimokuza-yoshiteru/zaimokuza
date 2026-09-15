import assert from 'node:assert/strict';

type Turn = { id: string; text: string };
type Input = { previous: string; old_turns: Turn[] };
function compact(previous: string, turns: Turn[], summarize: (data: Input) => string, keep = 1) {
  if (keep < 1 || turns.length <= keep) throw new Error('没有可压缩的完整旧轮次');
  const old = turns.slice(0, -keep), recent = turns.slice(-keep);
  const summary = summarize({ previous, old_turns: old });
  if (!summary.trim()) throw new Error('空摘要不能替换历史');
  return { summary, source_ids: old.map(t => t.id), recent };
}

const turns = [{ id: 't1', text: '确认使用 PostgreSQL' }, { id: 't2', text: '接下来检查连接池' }];
const demoSummarizer = (data: Input) => {
  // 确定性替身，用于演示流程，不冒充真实模型摘要。
  assert.equal(data.previous, '目标：排查登录超时；约束：不要更换数据库');
  return '目标：排查登录超时；已确认 PostgreSQL；不要更换数据库。';
};
const checkpoint = compact('目标：排查登录超时；约束：不要更换数据库', turns, demoSummarizer);
assert.deepEqual(checkpoint.source_ids, ['t1']);
assert.deepEqual(checkpoint.recent, [turns[1]]);
assert.equal(turns.length, 2);
assert.throws(() => compact('旧摘要', turns, () => ''));
console.log(JSON.stringify({ source_ids: checkpoint.source_ids, kept: checkpoint.recent[0].id }));
