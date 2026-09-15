import json


def select_turns(turns, window, fixed, reserve):
    remaining = window - fixed - reserve
    if remaining < 0:
        raise ValueError("固定内容与输出预留已超过窗口")
    kept = []
    for turn in reversed(turns):
        # 每个 turn 是完整单元，工具调用和结果已经配对。
        if turn["tokens"] > remaining:
            if not kept:
                raise ValueError("最新轮次过大，需要先治理工具输出")
            break
        kept.insert(0, turn)
        remaining -= turn["tokens"]
    return kept


turns = [{"id": "t1", "tokens": 40}, {"id": "t2", "tokens": 32}, {"id": "t3", "tokens": 60}]
kept = select_turns(turns, window=120, fixed=20, reserve=30)
assert [t["id"] for t in kept] == ["t3"]
assert turns[0]["id"] == "t1"  # 选择视图不删除日志。
try:
    select_turns(turns, window=100, fixed=20, reserve=30)
except ValueError:
    pass
else:
    raise AssertionError("最新轮次不能被悄悄丢掉")
print(json.dumps({"kept": [t["id"] for t in kept]}))
