const MINIMUM_CACHEABLE_PREFIX = 1024;

function eligible_prefix(old: number[], current: number[], minimum: number): number {
  // 只计算最长相同前缀，再应用教学阈值。
  let length = 0;
  const limit = Math.min(old.length, current.length);
  while (length < limit && old[length] === current[length]) length += 1;
  return length >= minimum ? length : 0;
}

function fill(length: number, value: number): number[] {
  return Array(length).fill(value);
}

const fixedPrefix = fill(8192, 11);
const oldHistory = fill(20000, 22);
const old = [...fixedPrefix, ...oldHistory];

// 摘要和近期消息使用不同数字，表示它们不等于旧历史。
const compressed = [...fixedPrefix, ...fill(2048, 33), ...fill(1024, 44)];
const eligible = eligible_prefix(old, compressed, MINIMUM_CACHEABLE_PREFIX);
if (eligible !== 8192 || compressed.length !== 11264) throw new Error('压缩场景校验失败');

// 首 token 改变后，最长相同前缀从零开始。
const changedFirst = [...compressed];
changedFirst[0] = 99;
const changedPrefix = eligible_prefix(old, changedFirst, MINIMUM_CACHEABLE_PREFIX);
if (changedPrefix !== 0) throw new Error('首 token 变化场景校验失败');

// 相同前缀只有 512 个 token，未达到教学阈值。
const shortOld = fill(512, 55);
const shortCurrent = fill(512, 55);
const shortPrefix = eligible_prefix(shortOld, shortCurrent, MINIMUM_CACHEABLE_PREFIX);
if (shortPrefix !== 0) throw new Error('短前缀场景校验失败');

// 在已经压缩的上下文末尾追加消息，不改写已有前缀。
const nextTurn = [...compressed, ...fill(64, 66)];
const nextEligible = eligible_prefix(compressed, nextTurn, MINIMUM_CACHEABLE_PREFIX);
if (nextEligible !== 11264) throw new Error('追加消息场景校验失败');

// 这是离线教学模型：不实现 TTL、路由、实际缓存写入或块边界，
// eligible_prefix 也不是从供应商响应中测得的 cache hit。
console.log(JSON.stringify({
  eligible_prefix: eligible,
  input_tokens: compressed.length,
  changed_prefix: changedPrefix,
  short_prefix: shortPrefix,
  next_eligible: nextEligible,
}));
