"""Turn the SD 3.5 category covers into the files the site actually serves.

gen_sd35.py writes 1024x1024 PNGs of about 1.5 MB each, and the category page
shows them as a 16:9 hero, so a visitor was downloading a square lossless image
to look at a crop of it. For each `site/public/sfx/covers/<name>.png` this
writes, next to it:

    <name>.webp        1024x576 centre crop, the category page hero
    <name>-thumb.webp  96x96 centre crop, the /sfx hub row (shown at 48 px)
    ../og/<name>.jpg   1200x630, the category's share card (og:image)

then deletes the PNG, unless --keep is passed. Run it after generating a new
cover, and point the category's `coverImage` at the .webp:

    python scripts/compress-sfx-covers.py
"""

import argparse
from pathlib import Path

from PIL import Image

COVERS = Path(__file__).resolve().parent.parent / "site" / "public" / "sfx" / "covers"
OG = COVERS.parent / "og"


def crop_to(im: Image.Image, ratio: float) -> Image.Image:
    """Largest centred crop of `im` with width / height == ratio."""
    w, h = im.size
    if w / h > ratio:
        cw, ch = round(h * ratio), h
    else:
        cw, ch = w, round(w / ratio)
    left, top = (w - cw) // 2, (h - ch) // 2
    return im.crop((left, top, left + cw, top + ch))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--keep", action="store_true", help="keep the source PNGs")
    args = parser.parse_args()

    OG.mkdir(exist_ok=True)
    pngs = sorted(COVERS.glob("*.png"))
    before = after = 0
    for png in pngs:
        im = Image.open(png).convert("RGB")
        before += png.stat().st_size

        hero = crop_to(im, 16 / 9).resize((1024, 576), Image.LANCZOS)
        hero.save(COVERS / f"{png.stem}.webp", "WEBP", quality=80, method=6)

        thumb = crop_to(im, 1).resize((96, 96), Image.LANCZOS)
        thumb.save(COVERS / f"{png.stem}-thumb.webp", "WEBP", quality=80, method=6)

        card = crop_to(im, 1200 / 630).resize((1200, 630), Image.LANCZOS)
        card.save(OG / f"{png.stem}.jpg", "JPEG", quality=82, optimize=True, progressive=True)

        for out in (COVERS / f"{png.stem}.webp", COVERS / f"{png.stem}-thumb.webp", OG / f"{png.stem}.jpg"):
            after += out.stat().st_size
        if not args.keep:
            png.unlink()

    print(f"{len(pngs)} covers: {before / 1e6:.1f} MB of PNG -> {after / 1e6:.1f} MB of WebP + JPG")


if __name__ == "__main__":
    main()
