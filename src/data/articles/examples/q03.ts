import assert from 'node:assert/strict';

class ContextOverflow extends Error {}
function request(tokens: number, send: (n: number) => string, compact: (n: number) => number, window: number) {
  const shrink = (size: number) => {
    const smaller = compact(size);
    if (smaller < 0 || smaller >= size) throw new Error('压缩未减小上下文，停止重试');
    return smaller;
  };
  if (tokens >= window * 0.8) tokens = shrink(tokens);
  try { return send(tokens); }
  catch (error) {
    if (!(error instanceof ContextOverflow)) throw error;
    // 只对上下文溢出补救一次；其他错误直接传播。
    return send(shrink(tokens));
  }
}

const calls: number[] = [];
const provider = (tokens: number) => {
  calls.push(tokens);
  if (tokens > 60) throw new ContextOverflow();
  return 'ok';
};
assert.equal(request(70, provider, n => Math.floor(n / 2), 100), 'ok');
assert.deepEqual(calls, [70, 35]);
console.log(JSON.stringify({ attempts: calls }));
