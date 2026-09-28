# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "fonttools==4.66.0",
#     "brotli==1.2.0",
# ]
#
# [tool.uv]
# exclude-newer = "2026-09-27T00:00:00Z"
# ///
"""Builds WordCell Serif (AD-18 Font, DESIGN.md A-D2) from the checksum-pinned Fraunces source.

Run: uv run scripts/build-font.py (any cwd). Not run by tests or CI (A-A5).

Downloads the pinned Fraunces variable TTF and OFL.txt into generated/font/ (git-ignored),
verifies their SHA-256 (the constants below match data/README.md, checked by the AD-18 parity test
in scripts/build-font.test.mjs), instances wght 600, opsz 48, SOFT 0, WONK 0, subsets to A-Z and
`u`, and writes src/ui/assets/wordcell-serif.woff2 and src/ui/assets/OFL.txt (both committed).
A source hash mismatch, a download error or a failed cmap assertion exits non-zero before
either output is written (rule 6).
"""

import hashlib
import os
from pathlib import Path
from urllib.request import urlopen

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

TTF_URL = "https://raw.githubusercontent.com/google/fonts/4024282d9b0cffcdb8e3024560862746178d741f/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
TTF_SHA256 = "177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb"
OFL_URL = "https://raw.githubusercontent.com/google/fonts/4024282d9b0cffcdb8e3024560862746178d741f/ofl/fraunces/OFL.txt"
OFL_SHA256 = "bdf4c22802eaf804f998195871c6b8938aac2ac14b2d78a8bd66a6f1eced833b"

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "generated" / "font"
ASSETS_DIR = ROOT / "src" / "ui" / "assets"
TTF_CACHE = CACHE_DIR / "Fraunces[SOFT,WONK,opsz,wght].ttf"
OFL_CACHE = CACHE_DIR / "OFL.txt"
WOFF2_OUT = ASSETS_DIR / "wordcell-serif.woff2"
OFL_OUT = ASSETS_DIR / "OFL.txt"

# (cache path, url, expected sha256), in download order: TTF, then OFL.txt.
SOURCES = [
    (TTF_CACHE, TTF_URL, TTF_SHA256),
    (OFL_CACHE, OFL_URL, OFL_SHA256),
]

AXES = {"wght": 600, "opsz": 48, "SOFT": 0, "WONK": 0}
UNICODES = [*range(0x41, 0x5B), 0x75]  # A-Z and u (SPEC CAP-4)


def fail(message: str) -> None:
    raise SystemExit(f"build-font: {message}")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def part_path(path: Path) -> Path:
    return path.with_name(path.name + ".part")


def verify_cache() -> None:
    for path, _url, expected in SOURCES:
        if not path.exists():
            continue
        actual = sha256(path.read_bytes())
        if actual != expected:
            fail(
                f"cached {path} has SHA-256 {actual}, expected {expected}; "
                f"delete {path} and run again"
            )


def download(path: Path, url: str, expected: str) -> None:
    part = part_path(path)
    try:
        with urlopen(url, timeout=60) as response:
            if response.status != 200:
                fail(f"GET {url} returned {response.status}")
            with open(part, "wb") as out:
                while chunk := response.read(1 << 16):
                    out.write(chunk)
        actual = sha256(part.read_bytes())
        if actual != expected:
            fail(f"downloaded {url} has SHA-256 {actual}, expected {expected} (for {path})")
        os.replace(part, path)
    finally:
        part.unlink(missing_ok=True)


def fetch_sources() -> None:
    verify_cache()
    for path, url, expected in SOURCES:
        if path.exists():
            print(f"cache hit: {path.relative_to(ROOT)}")
        else:
            download(path, url, expected)
            print(f"downloaded: {path.relative_to(ROOT)}")


def build_font() -> TTFont:
    font = TTFont(TTF_CACHE, recalcTimestamp=False)
    font = instantiateVariableFont(font, AXES)
    options = Options(name_IDs=[*Options().name_IDs, 13, 14])
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(font)
    codepoints = sorted(
        {cp for table in font["cmap"].tables if table.isUnicode() for cp in table.cmap}
    )
    if codepoints != sorted(UNICODES):
        fail(f"subset cmap {[hex(cp) for cp in codepoints]} is not exactly A-Z and u")
    print("cmap:", " ".join(f"U+{cp:04X}" for cp in codepoints))
    font.flavor = "woff2"
    font.recalcTimestamp = False
    return font


def write_outputs(font: TTFont) -> None:
    woff2_part = part_path(WOFF2_OUT)
    ofl_part = part_path(OFL_OUT)
    try:
        font.save(woff2_part)
        ofl_part.write_bytes(OFL_CACHE.read_bytes())
        os.replace(woff2_part, WOFF2_OUT)
        os.replace(ofl_part, OFL_OUT)
    finally:
        woff2_part.unlink(missing_ok=True)
        ofl_part.unlink(missing_ok=True)
    print(f"wrote {WOFF2_OUT.relative_to(ROOT)} ({WOFF2_OUT.stat().st_size} bytes)")
    print(f"wrote {OFL_OUT.relative_to(ROOT)}")


def main() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    fetch_sources()
    # Re-check both hashes right before writing (the cache may predate this run).
    verify_cache()
    font = build_font()
    write_outputs(font)


if __name__ == "__main__":
    main()
