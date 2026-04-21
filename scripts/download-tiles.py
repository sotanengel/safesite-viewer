#!/usr/bin/env python3
"""
download-tiles.py — ローカルタイルキャッシュ (tiles.db) を構築するスクリプト。

ハザードレイヤー: 日本全国, zoom 10-13
地形レイヤー:     関東のみ, zoom 10-13
関東外の地形タイルは自動的に外部サーバーへフォールバックします。

使い方:
    pip install aiohttp
    python scripts/download-tiles.py

オプション:
    --db /path/to/tiles.db    (デフォルト: プロジェクトルートの tiles.db)
    --dry-run                 (ダウンロードせずタイル数だけ表示)
    --layer flood-max         (特定レイヤーのみ)
    --min-zoom 10 --max-zoom 11  (ズーム範囲を絞る)
"""

import argparse
import asyncio
import logging
import math
import sqlite3
import sys
from pathlib import Path

# ── bbox 定義 ────────────────────────────────────────────────────────────────

JAPAN_BBOX  = {"min_lon": 122.0, "max_lon": 154.0, "min_lat": 24.0,  "max_lat": 46.0}
KANTO_BBOX  = {"min_lon": 138.5, "max_lon": 141.5, "min_lat": 34.8,  "max_lat": 37.2}

# ── レイヤー定義 ─────────────────────────────────────────────────────────────

LAYER_CONFIGS = [
    # ── ハザード（日本全国、スパース） ──
    {
        "id": "flood-max",
        "url": "https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png",
        "bbox": JAPAN_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    {
        "id": "tsunami",
        "url": "https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png",
        "bbox": JAPAN_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    {
        "id": "landslide-warning",
        "url": "https://disaportaldata.gsi.go.jp/raster/05_dosekiryu_warning_area_data/{z}/{x}/{y}.png",
        "bbox": JAPAN_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    {
        "id": "landslide-special",
        "url": "https://disaportaldata.gsi.go.jp/raster/05_dosekiryu_kikenku_data/{z}/{x}/{y}.png",
        "bbox": JAPAN_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    {
        "id": "high-tide",
        "url": "https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png",
        "bbox": JAPAN_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    # ── 地形（関東のみ） ──
    {
        "id": "terrain-relief",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png",
        "bbox": KANTO_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    {
        "id": "terrain-slope",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png",
        "bbox": KANTO_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    {
        "id": "terrain-floodplain",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/chisui/{z}/{x}/{y}.png",
        "bbox": KANTO_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    {
        "id": "terrain-land-condition",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/lcm25k/{z}/{x}/{y}.png",
        "bbox": KANTO_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
    {
        "id": "evacuation-shelter",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/experimental_evac/{z}/{x}/{y}.png",
        "bbox": KANTO_BBOX,
        "min_zoom": 10,
        "max_zoom": 13,
    },
]

# ── 定数 ─────────────────────────────────────────────────────────────────────

CONCURRENCY = 20
DELAY_S = 0.05          # 50ms
CONNECT_TIMEOUT_S = 10
READ_TIMEOUT_S = 30
MAX_RETRIES = 3
EMPTY_TILE_MAX_BYTES = 200  # GSI の透過 PNG stub は 67 バイト
COMMIT_EVERY = 500

USER_AGENT = (
    "safesite-viewer-tile-downloader/1.0 "
    "(github.com/sotanengel/safesite-viewer; offline use)"
)


# ── タイル座標計算 ────────────────────────────────────────────────────────────

def lon_to_x(lon: float, z: int) -> int:
    return int(math.floor((lon + 180.0) / 360.0 * (2 ** z)))


def lat_to_y(lat: float, z: int) -> int:
    lat_rad = math.radians(lat)
    n = 2 ** z
    return int(math.floor((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n))


def tiles_for_zoom(z: int, bbox: dict) -> list[tuple[int, int, int]]:
    x_min = lon_to_x(bbox["min_lon"], z)
    x_max = lon_to_x(bbox["max_lon"], z)
    y_min = lat_to_y(bbox["max_lat"], z)  # 北 → y 小
    y_max = lat_to_y(bbox["min_lat"], z)  # 南 → y 大
    return [
        (z, x, y)
        for x in range(x_min, x_max + 1)
        for y in range(y_min, y_max + 1)
    ]


def all_tiles(cfg: dict) -> list[tuple[int, int, int]]:
    result = []
    for z in range(cfg["min_zoom"], cfg["max_zoom"] + 1):
        result.extend(tiles_for_zoom(z, cfg["bbox"]))
    return result


# ── SQLite 初期化 ─────────────────────────────────────────────────────────────

def init_db(db_path: Path) -> sqlite3.Connection:
    con = sqlite3.connect(str(db_path))
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    con.execute("""
        CREATE TABLE IF NOT EXISTS tiles (
            layer      TEXT    NOT NULL,
            zoom_level INTEGER NOT NULL,
            tile_col   INTEGER NOT NULL,
            tile_row   INTEGER NOT NULL,
            tile_data  BLOB    NOT NULL,
            PRIMARY KEY (layer, zoom_level, tile_col, tile_row)
        )
    """)
    con.commit()
    return con


def existing_tiles(con: sqlite3.Connection, layer_id: str) -> set[tuple[int, int, int]]:
    rows = con.execute(
        "SELECT zoom_level, tile_col, tile_row FROM tiles WHERE layer=?", (layer_id,)
    ).fetchall()
    return {(z, x, y) for z, x, y in rows}


# ── 非同期ダウンロード ────────────────────────────────────────────────────────

async def fetch_one(
    session,
    semaphore: asyncio.Semaphore,
    url_template: str,
    z: int,
    x: int,
    y: int,
) -> bytes | None:
    url = url_template.replace("{z}", str(z)).replace("{x}", str(x)).replace("{y}", str(y))
    async with semaphore:
        await asyncio.sleep(DELAY_S)
        for attempt in range(MAX_RETRIES):
            try:
                async with session.get(url) as resp:
                    if resp.status == 404:
                        return None
                    if resp.status == 200:
                        data = await resp.read()
                        return None if len(data) <= EMPTY_TILE_MAX_BYTES else data
                    if resp.status >= 500:
                        raise Exception(f"HTTP {resp.status}")
                    return None
            except Exception as exc:
                if attempt == MAX_RETRIES - 1:
                    logging.warning("Failed %s: %s", url, exc)
                    return None
                await asyncio.sleep(2 ** attempt)
    return None


async def download_layer(cfg: dict, tiles: list, con: sqlite3.Connection) -> int:
    import aiohttp

    semaphore = asyncio.Semaphore(CONCURRENCY)
    timeout = aiohttp.ClientTimeout(connect=CONNECT_TIMEOUT_S, sock_read=READ_TIMEOUT_S)
    saved = 0
    pending: list[tuple[bytes, int, int, int]] = []

    async with aiohttp.ClientSession(timeout=timeout, headers={"User-Agent": USER_AGENT}) as session:
        tasks = {
            asyncio.create_task(fetch_one(session, semaphore, cfg["url"], z, x, y)): (z, x, y)
            for z, x, y in tiles
        }
        done_count = 0
        for coro in asyncio.as_completed(tasks):
            (z, x, y) = tasks[coro._coro if hasattr(coro, '_coro') else coro]  # type: ignore[attr-defined]
            pass

        # Simpler approach: gather in chunks
        chunk_size = 500
        tile_list = list(tiles)
        for i in range(0, len(tile_list), chunk_size):
            chunk = tile_list[i : i + chunk_size]
            results = await asyncio.gather(
                *[fetch_one(session, semaphore, cfg["url"], z, x, y) for z, x, y in chunk]
            )
            for (z, x, y), data in zip(chunk, results):
                if data is not None:
                    pending.append((data, z, x, y))
                    saved += 1

            # バッチコミット
            if len(pending) >= COMMIT_EVERY:
                con.executemany(
                    "INSERT OR REPLACE INTO tiles VALUES (?, ?, ?, ?, ?)",
                    [(cfg["id"], z, x, y, d) for d, z, x, y in pending],
                )
                con.commit()
                pending.clear()

            done = min(i + chunk_size, len(tile_list))
            logging.info(
                "[%s] %d/%d processed, %d saved",
                cfg["id"], done, len(tile_list), saved,
            )

    if pending:
        con.executemany(
            "INSERT OR REPLACE INTO tiles VALUES (?, ?, ?, ?, ?)",
            [(cfg["id"], z, x, y, d) for d, z, x, y in pending],
        )
        con.commit()

    return saved


# ── メイン ───────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).parent.parent
    p = argparse.ArgumentParser(description="ローカルタイルキャッシュ (tiles.db) を構築します")
    p.add_argument("--db", default=str(project_root / "tiles.db"), help="SQLite DB パス")
    p.add_argument("--dry-run", action="store_true", help="ダウンロードせずタイル数だけ表示")
    p.add_argument("--layer", help="特定レイヤーのみ処理 (例: flood-max)")
    p.add_argument("--min-zoom", type=int, help="ズーム下限を上書き")
    p.add_argument("--max-zoom", type=int, help="ズーム上限を上書き")
    return p.parse_args()


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
    )

    try:
        import aiohttp  # noqa: F401
    except ImportError:
        logging.error("aiohttp が必要です: pip install aiohttp")
        sys.exit(1)

    args = parse_args()
    db_path = Path(args.db)

    configs = LAYER_CONFIGS
    if args.layer:
        configs = [c for c in configs if c["id"] == args.layer]
        if not configs:
            logging.error("レイヤーが見つかりません: %s", args.layer)
            sys.exit(1)

    # ズーム上書き
    if args.min_zoom or args.max_zoom:
        configs = [
            {**c,
             "min_zoom": args.min_zoom if args.min_zoom else c["min_zoom"],
             "max_zoom": args.max_zoom if args.max_zoom else c["max_zoom"]}
            for c in configs
        ]

    # タイル数集計
    total_slots = sum(len(all_tiles(c)) for c in configs)
    logging.info("対象レイヤー: %d本  タイルスロット合計: %d", len(configs), total_slots)

    if args.dry_run:
        for c in configs:
            t = all_tiles(c)
            logging.info("  [%s] bbox=%s zoom=%d-%d → %d slots",
                         c["id"], "japan" if c["bbox"] == JAPAN_BBOX else "kanto",
                         c["min_zoom"], c["max_zoom"], len(t))
        return

    con = init_db(db_path)
    logging.info("DB: %s", db_path)

    total_saved = 0
    for cfg in configs:
        tiles = all_tiles(cfg)
        already = existing_tiles(con, cfg["id"])
        missing = [(z, x, y) for z, x, y in tiles if (z, x, y) not in already]
        logging.info(
            "[%s] スロット=%d  既存=%d  未取得=%d",
            cfg["id"], len(tiles), len(already), len(missing),
        )
        if not missing:
            logging.info("[%s] スキップ（全て取得済み）", cfg["id"])
            continue

        saved = asyncio.run(download_layer(cfg, missing, con))
        total_saved += saved
        logging.info("[%s] 完了: %d タイル保存", cfg["id"], saved)

    con.close()

    size_mb = db_path.stat().st_size / (1024 * 1024)
    logging.info("完了。tiles.db サイズ: %.1f MB  今回保存: %d タイル", size_mb, total_saved)


if __name__ == "__main__":
    main()
