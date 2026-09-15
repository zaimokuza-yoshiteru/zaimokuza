import hashlib
import json
import tempfile
from pathlib import Path


def tool_output(text, directory, preview_chars=32):
    if len(text) <= preview_chars:
        return {"preview": text, "artifact": None, "truncated": False}
    name = hashlib.sha256(text.encode()).hexdigest()[:16] + ".txt"
    # 先写入成功，才能向模型承诺存在可回读的原文。
    (Path(directory) / name).write_text(text, encoding="utf-8")
    return {"preview": text[:preview_chars], "artifact": name, "truncated": True}


with tempfile.TemporaryDirectory() as directory:
    result = tool_output("connection timeout\n" * 10, directory)
    assert result["truncated"]
    assert (Path(directory) / result["artifact"]).read_text() == "connection timeout\n" * 10
    # 自定义中间表示；适配器必须把 image 转成供应商的真实图片内容块。
    blocks = [{"kind": "text", "text": result["preview"]}, {"kind": "image", "source": "screenshot.png"}]
    assert blocks[1]["kind"] == "image"
    print(json.dumps({"preview_length": len(result["preview"]), "kinds": [b["kind"] for b in blocks]}))
