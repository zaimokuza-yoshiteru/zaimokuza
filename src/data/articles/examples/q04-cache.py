import json
from typing import List


MINIMUM_CACHEABLE_PREFIX = 1024


def eligible_prefix(old: List[int], current: List[int], minimum: int) -> int:
    """返回教学模型中达到阈值的最长相同前缀长度。"""
    length = 0
    for previous, latest in zip(old, current):
        if previous != latest:
            break
        length += 1
    return length if length >= minimum else 0


def fill(length: int, value: int) -> List[int]:
    return [value] * length


fixed_prefix = fill(8192, 11)
old_history = fill(20000, 22)
old = fixed_prefix + old_history

# 摘要和近期消息使用不同数字，表示它们不等于旧历史。
compressed = fixed_prefix + fill(2048, 33) + fill(1024, 44)
eligible = eligible_prefix(old, compressed, MINIMUM_CACHEABLE_PREFIX)
assert eligible == 8192
assert len(compressed) == 11264

# 首 token 改变后，最长相同前缀从零开始。
changed_first = compressed.copy()
changed_first[0] = 99
changed_prefix = eligible_prefix(old, changed_first, MINIMUM_CACHEABLE_PREFIX)
assert changed_prefix == 0

# 相同前缀只有 512 个 token，未达到教学阈值。
short_old = fill(512, 55)
short_current = fill(512, 55)
short_prefix = eligible_prefix(short_old, short_current, MINIMUM_CACHEABLE_PREFIX)
assert short_prefix == 0

# 在已经压缩的上下文末尾追加消息，不改写已有前缀。
next_turn = compressed + fill(64, 66)
next_eligible = eligible_prefix(compressed, next_turn, MINIMUM_CACHEABLE_PREFIX)
assert next_eligible == 11264

# 这是离线教学模型：不实现 TTL、路由、实际缓存写入或块边界，
# eligible_prefix 也不是从供应商响应中测得的 cache hit。
print(
    json.dumps(
        {
            "eligible_prefix": eligible,
            "input_tokens": len(compressed),
            "changed_prefix": changed_prefix,
            "short_prefix": short_prefix,
            "next_eligible": next_eligible,
        },
        separators=(",", ":"),
    )
)
