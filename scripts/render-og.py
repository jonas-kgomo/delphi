#!/usr/bin/env python3
"""Render Open Graph / favicon assets for The Precinct."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og"
FONTS = Path.home() / "Library" / "Fonts"

EMBER = (197, 80, 45)  # ember-500 — landing hero
CREAM = (241, 246, 239)
INK = (11, 37, 46)
INK_950 = (11, 11, 11)
WHITE = (255, 255, 255)
WHITE_70 = (255, 255, 255, 178)
WHITE_90 = (255, 255, 255, 230)

W, H = 1200, 630
SQ = 1200
SCALE = 2


def font(path: Path, size: int, axes: list[float]) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(path), size)
    f.set_variation_by_axes(axes)
    return f


def serif(size: int, weight: float = 600, opsz: float = 14) -> ImageFont.FreeTypeFont:
    return font(
        FONTS / "SourceSerif4-VariableFont_opsz,wght.ttf",
        size,
        [weight, opsz],
    )


def sans(size: int, weight: float = 500) -> ImageFont.FreeTypeFont:
    return font(FONTS / "Inter.ttf", size, [weight, 0])


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def down(im: Image.Image, w: int, h: int) -> Image.Image:
    return im.resize((w, h), Image.Resampling.LANCZOS)


def mark(draw: ImageDraw.ImageDraw, x: int, y: int, r: int, fill=INK_950, letter=WHITE) -> None:
    draw.ellipse((x, y, x + r, y + r), fill=fill)
    fnt = sans(int(r * 0.42), 600)
    text = "P"
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (x + (r - tw) / 2 - bbox[0], y + (r - th) / 2 - bbox[1] - r * 0.02),
        text,
        font=fnt,
        fill=letter,
    )


def save(im: Image.Image, name: str, size: tuple[int, int]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    down(im, *size).save(path, "PNG", optimize=True)
    print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024}kb)")


def paint_home(square: bool = False) -> Image.Image:
    w, h = (SQ, SQ) if square else (W, H)
    im = Image.new("RGB", (w * SCALE, h * SCALE), EMBER)
    d = ImageDraw.Draw(im, "RGBA")
    s = SCALE
    pad = 72 * s
    mark(d, pad, pad, 56 * s, fill=INK_950, letter=WHITE)
    d.text((pad + 72 * s, pad + 4 * s), "The Precinct", font=serif(34 * s, 600, 12), fill=WHITE)
    d.text(
        (pad + 72 * s, pad + 44 * s),
        "PRECINCT.CITY",
        font=sans(13 * s, 500),
        fill=(255, 255, 255, 185),
    )

    headline = "Elicit what people actually hold"
    hf = serif(62 * s if not square else 72 * s, 600, 14)
    max_w = w * s - pad * 2
    lines = wrap(d, headline, hf, max_w)
    y = (260 if not square else 380) * s
    for line in lines:
        d.text((pad, y), line, font=hf, fill=WHITE)
        y += int(hf.size * 1.12)

    sub = "Views sit below a first answer — for civic groups, government, and enterprise."
    sf = serif(26 * s, 400, 12)
    y += 18 * s
    for line in wrap(d, sub, sf, max_w):
        d.text((pad, y), line, font=sf, fill=(255, 255, 255, 230))
        y += int(sf.size * 1.35)

    wards = "Deliberate   ·   Survey   ·   Elicit   ·   Bridge"
    d.text((pad, h * s - pad - 8 * s), wards, font=sans(16 * s, 500), fill=(255, 255, 255, 200))
    return im


def paint_split(
    eyebrow: str,
    title: str,
    lead: str,
    foot: str,
) -> Image.Image:
    im = Image.new("RGB", (W * SCALE, H * SCALE), CREAM)
    d = ImageDraw.Draw(im, "RGBA")
    s = SCALE
    d.rectangle((0, 0, W * s, 118 * s), fill=EMBER)
    pad = 72 * s
    mark(d, pad, 31 * s, 56 * s)
    d.text((pad + 72 * s, 36 * s), "The Precinct", font=serif(32 * s, 600, 12), fill=WHITE)
    d.text(
        (pad + 72 * s, 76 * s),
        "PRECINCT.CITY",
        font=sans(12 * s, 500),
        fill=(255, 255, 255, 185),
    )

    d.text((pad, 168 * s), eyebrow.upper(), font=sans(14 * s, 500), fill=(107, 135, 112))
    tf = serif(56 * s, 600, 14)
    y = 198 * s
    for line in wrap(d, title, tf, W * s - pad * 2):
        d.text((pad, y), line, font=tf, fill=INK)
        y += int(tf.size * 1.1)

    lf = serif(26 * s, 400, 12)
    y += 16 * s
    for line in wrap(d, lead, lf, W * s - pad * 2):
        d.text((pad, y), line, font=lf, fill=INK)
        y += int(lf.size * 1.35)

    d.text((pad, H * s - pad), foot, font=sans(15 * s, 500), fill=(107, 135, 112))
    return im


def paint_icon(size: int, bg=INK_950, fg=WHITE) -> Image.Image:
    im = Image.new("RGB", (size * SCALE, size * SCALE), bg)
    d = ImageDraw.Draw(im)
    s = SCALE
    inset = int(size * 0.08) * s
    d.ellipse((inset, inset, size * s - inset, size * s - inset), fill=bg)
    fnt = sans(int(size * 0.46) * s, 600)
    bbox = d.textbbox((0, 0), "P", font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(
        ((size * s - tw) / 2 - bbox[0], (size * s - th) / 2 - bbox[1] - size * 0.02 * s),
        "P",
        font=fnt,
        fill=fg,
    )
    return im


def main() -> None:
    save(paint_home(False), "home.png", (W, H))
    save(paint_home(True), "home-square.png", (SQ, SQ))
    save(
        paint_split(
            "For government",
            "Precinct for Government",
            "Infrastructure, service delivery, and the file that ward and Pretoria should read together.",
            "Deliberate  ·  Survey  ·  Elicit  ·  Bridge",
        ),
        "government.png",
        (W, H),
    )
    save(
        paint_split(
            "For development",
            "Precinct for Development",
            "Climate, health, livelihoods — and the informal knowledge that plans usually skip.",
            "Deliberate  ·  Survey  ·  Elicit  ·  Bridge",
        ),
        "development.png",
        (W, H),
    )
    save(
        paint_split(
            "For technology",
            "Precinct for Technology",
            "How people meet tools: trust, language, and who belongs in the governance room.",
            "Deliberate  ·  Survey  ·  Elicit  ·  Bridge",
        ),
        "technology.png",
        (W, H),
    )
    save(
        paint_split(
            "Interview",
            "A conversation, not a form",
            "Someone asked you to sit with The Precinct. Your answers stay with this interview.",
            "precinct.city",
        ),
        "interview.png",
        (W, H),
    )
    save(
        paint_split(
            "Deliberation",
            "Agree, disagree, or pass",
            "A living vote on statements drawn from interviews — consensus, not a tally.",
            "precinct.city",
        ),
        "deliberate.png",
        (W, H),
    )

    save(paint_icon(180, bg=INK_950, fg=WHITE), "apple-touch-icon.png", (180, 180))
    save(paint_icon(32, bg=INK_950, fg=WHITE), "favicon-32.png", (32, 32))
    save(paint_icon(512, bg=EMBER, fg=WHITE), "icon-512.png", (512, 512))


if __name__ == "__main__":
    main()
