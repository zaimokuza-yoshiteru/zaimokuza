import json


class ContextOverflow(Exception):
    pass


def request(tokens, send, compact, window):
    def shrink(size):
        smaller = compact(size)
        if not 0 <= smaller < size:
            raise ValueError("压缩未减小上下文，停止重试")
        return smaller

    if tokens >= window * 0.8:
        tokens = shrink(tokens)
    try:
        return send(tokens)
    except ContextOverflow:
        # 只对上下文溢出补救一次；其他错误直接传播。
        return send(shrink(tokens))


calls = []
def provider(tokens):
    calls.append(tokens)
    if tokens > 60:
        raise ContextOverflow()
    return "ok"

assert request(70, provider, lambda n: n // 2, 100) == "ok"
assert calls == [70, 35]  # 本地估算低于阈值，服务端仍可能拒绝。
print(json.dumps({"attempts": calls}))
