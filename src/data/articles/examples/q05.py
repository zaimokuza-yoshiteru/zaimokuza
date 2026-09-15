import json
import os
import tempfile
from pathlib import Path


def commit(directory, state, fail_before_replace=False):
    target = Path(directory) / "context.json"
    with tempfile.NamedTemporaryFile(mode="w", dir=directory, delete=False) as file:
        pending = Path(file.name)
        json.dump(state, file)
        file.flush()
        os.fsync(file.fileno())
    try:
        if fail_before_replace:
            raise RuntimeError("模拟提交前中断")
        os.replace(pending, target)  # 同文件系统、单写者的原子替换。
    finally:
        pending.unlink(missing_ok=True)


with tempfile.TemporaryDirectory() as directory:
    commit(directory, {"version": 1, "summary": "old"})
    try:
        commit(directory, {"version": 2, "summary": "new"}, True)
    except RuntimeError:
        pass
    recovered = json.loads((Path(directory) / "context.json").read_text())
    assert recovered["version"] == 1
    print(json.dumps({"recovered_version": recovered["version"]}))
