import json


def compact(previous_summary, turns, summarize, keep=1):
    if keep < 1 or len(turns) <= keep:
        raise ValueError("没有可压缩的完整旧轮次")
    old, recent = turns[:-keep], turns[-keep:]
    summary = summarize({"previous": previous_summary, "old_turns": old})
    if not summary.strip():
        raise ValueError("空摘要不能替换历史")
    return {"summary": summary, "source_ids": [t["id"] for t in old], "recent": recent}


turns = [{"id": "t1", "text": "确认使用 PostgreSQL"}, {"id": "t2", "text": "接下来检查连接池"}]
def demo_summarizer(data):
    # 确定性替身，用于演示流程，不冒充真实模型摘要。
    assert data["previous"] == "目标：排查登录超时；约束：不要更换数据库"
    return "目标：排查登录超时；已确认 PostgreSQL；不要更换数据库。"

checkpoint = compact("目标：排查登录超时；约束：不要更换数据库", turns, demo_summarizer)
assert checkpoint["source_ids"] == ["t1"]
assert checkpoint["recent"] == [turns[1]]
assert len(turns) == 2
try:
    compact("旧摘要", turns, lambda data: "")
except ValueError:
    pass
else:
    raise AssertionError("空摘要必须被拒绝")
print(json.dumps({"source_ids": checkpoint["source_ids"], "kept": checkpoint["recent"][0]["id"]}))
