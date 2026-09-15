import assert from 'node:assert/strict';

type Message = { role: string; content: string };
type Parent = { tools: string[]; private_note: string; completed_turns: Message[] };
function delegate(task: string, parent: Parent, mode: 'fresh' | 'fork' = 'fresh') {
  const inherited = mode === 'fork' ? structuredClone(parent.completed_turns) : [];
  // 历史继承与工具权限分别决定，不复制整个父对象。
  return { tools: ['read'], messages: [...inherited, { role: 'user', content: task }] };
}

const parent: Parent = { tools: ['read', 'write'], private_note: '不自动继承', completed_turns: [
  { role: 'user', content: '已确认使用 PostgreSQL' },
] };
const fresh = delegate('只核对超时配置', parent);
const fork = delegate('沿用已确认的背景核对超时配置', parent, 'fork');
assert.equal(fresh.messages.length, 1);
assert.equal(fork.messages.length, 2);
assert.deepEqual(fork.tools, ['read']);
assert.ok(!('private_note' in fork));
fork.messages[0].content = '子代理自己的副本';
assert.equal(parent.completed_turns[0].content, '已确认使用 PostgreSQL');
console.log(JSON.stringify({ fresh: fresh.messages.length, fork: fork.messages.length, tools: fork.tools }));
