import assert from 'node:assert/strict';

type Turn = { id: string; tokens: number };
function selectTurns(turns: Turn[], window: number, fixed: number, reserve: number): Turn[] {
  let remaining = window - fixed - reserve;
  if (remaining < 0) throw new Error('固定内容与输出预留已超过窗口');
  const kept: Turn[] = [];
  for (const turn of [...turns].reverse()) {
    // 每个 turn 是完整单元，工具调用和结果已经配对。
    if (turn.tokens > remaining) {
      if (!kept.length) throw new Error('最新轮次过大，需要先治理工具输出');
      break;
    }
    kept.unshift(turn);
    remaining -= turn.tokens;
  }
  return kept;
}

const turns = [{ id: 't1', tokens: 40 }, { id: 't2', tokens: 32 }, { id: 't3', tokens: 60 }];
const kept = selectTurns(turns, 120, 20, 30);
assert.deepEqual(kept.map(t => t.id), ['t3']);
assert.equal(turns[0].id, 't1');
assert.throws(() => selectTurns(turns, 100, 20, 30));
console.log(JSON.stringify({ kept: kept.map(t => t.id) }));
