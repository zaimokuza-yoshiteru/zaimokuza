import json


def cleanup_plan(records, referenced_ids, cutoff_day):
    # 这里只规划；活跃记录和摘要仍引用的原文不能因过期被删。
    return [r["id"] for r in records
            if r["last_used_day"] < cutoff_day
            and not r["active"] and r["id"] not in referenced_ids]


records = [
    {"id": "old", "last_used_day": 10, "active": False},
    {"id": "evidence", "last_used_day": 10, "active": False},
    {"id": "live", "last_used_day": 10, "active": True},
    {"id": "recent", "last_used_day": 90, "active": False},
]
plan = cleanup_plan(records, {"evidence"}, cutoff_day=70)
assert plan == ["old"]
assert len(records) == 4
print(json.dumps({"delete_candidates": plan}))
