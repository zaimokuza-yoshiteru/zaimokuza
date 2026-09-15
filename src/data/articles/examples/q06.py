import json
import sqlite3


with sqlite3.connect(":memory:") as db:
    db.execute("CREATE VIRTUAL TABLE history USING fts5(id UNINDEXED, text)")
    db.executemany("INSERT INTO history VALUES (?, ?)", [
        ("t1", "login succeeds after restart"),
        ("t2", "database connection timeout after 30 seconds"),
        ("t3", "image upload format mismatch"),
    ])
    # FTS5 的 bm25 分数越小越靠前；这不是向量相似度。
    hits = db.execute(
        "SELECT id FROM history WHERE history MATCH ? ORDER BY bm25(history) LIMIT 2",
        ('"timeout"',),
    ).fetchall()
    assert hits == [("t2",)]
    original = db.execute("SELECT text FROM history WHERE id = ?", (hits[0][0],)).fetchone()[0]
    assert "30 seconds" in original
    print(json.dumps({"ids": [row[0] for row in hits], "original": original}))
