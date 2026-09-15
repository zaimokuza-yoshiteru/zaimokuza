import copy
import json


def delegate(task, parent, mode="fresh"):
    if mode not in ("fresh", "fork"):
        raise ValueError("未知继承模式")
    inherited = copy.deepcopy(parent["completed_turns"]) if mode == "fork" else []
    # 历史继承与工具权限分别决定，不复制整个父对象。
    return {"tools": ["read"], "messages": inherited + [{"role": "user", "content": task}]}


parent = {"tools": ["read", "write"], "private_note": "不自动继承", "completed_turns": [
    {"role": "user", "content": "已确认使用 PostgreSQL"},
]}
fresh = delegate("只核对超时配置", parent)
fork = delegate("沿用已确认的背景核对超时配置", parent, "fork")
assert len(fresh["messages"]) == 1 and len(fork["messages"]) == 2
assert fork["tools"] == ["read"] and "private_note" not in fork
fork["messages"][0]["content"] = "子代理自己的副本"
assert parent["completed_turns"][0]["content"] == "已确认使用 PostgreSQL"
print(json.dumps({"fresh": len(fresh["messages"]), "fork": len(fork["messages"]), "tools": fork["tools"]}))
