#!/usr/bin/env python3
"""Render Open Graph / favicon assets for The Precinct."""

from __future__ import annotations

from pathlib import Path
from shutil import copyfile

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og"
FONTS = Path.home() / "Library" / "Fonts"

# Site tokens — green, cream/white, orange
FOREST = (9, 92, 52)  # leaf-700
LEAF = (79, 217, 101)  # leaf-400
LEAF_DEEP = (63, 174, 81)  # leaf-500
EMBER = (255, 157, 76)  # ember-400
CREAM = (241, 246, 239)
INK = (11, 37, 46)
INK_950 = (11, 11, 11)
MOSS = (107, 135, 112)
WHITE = (255, 255, 255)
WHITE_70 = (255, 255, 255, 178)

W, H = 1200, 630
SQ = 1200
SCALE = 2
HEADER = 118
STRIPE = 14


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


def mark(draw: ImageDraw.ImageDraw, x: int, y: int, r: int, fill=EMBER, letter=WHITE) -> None:
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


def paint_chrome(d: ImageDraw.ImageDraw, w: int, s: int, pad: int) -> None:
    d.rectangle((0, 0, w * s, HEADER * s), fill=FOREST)
    d.rectangle((0, HEADER * s, w * s, (HEADER + STRIPE) * s), fill=LEAF)
    mark(d, pad, 31 * s, 56 * s, fill=EMBER, letter=WHITE)
    d.text((pad + 72 * s, 36 * s), "The Precinct", font=serif(32 * s, 600, 12), fill=WHITE)
    d.text(
        (pad + 72 * s, 76 * s),
        "PRECINCT.CITY",
        font=sans(12 * s, 500),
        fill=WHITE_70,
    )


def paint_cta(
    d: ImageDraw.ImageDraw,
    x: int,
    y: int,
    label: str,
    s: int,
) -> int:
    fnt = sans(20 * s, 600)
    bbox = d.textbbox((0, 0), label, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 32 * s, 18 * s
    bw, bh = tw + pad_x * 2, th + pad_y * 2
    d.rounded_rectangle((x, y, x + bw, y + bh), radius=bh / 2, fill=EMBER)
    d.text((x + pad_x - bbox[0], y + pad_y - bbox[1]), label, font=fnt, fill=INK)
    return y + bh


def paint_home(square: bool = False) -> Image.Image:
    w, h = (SQ, SQ) if square else (W, H)
    im = Image.new("RGB", (w * SCALE, h * SCALE), CREAM)
    d = ImageDraw.Draw(im, "RGBA")
    s = SCALE
    rail = int((400 if not square else 360) * s)
    d.rectangle((0, 0, rail, h * s), fill=FOREST)
    d.rectangle((rail, 0, rail + 14 * s, h * s), fill=LEAF)

    pad_l = 48 * s
    mark(d, pad_l, 56 * s, 72 * s, fill=EMBER, letter=WHITE)
    d.text((pad_l, 148 * s), "The Precinct", font=serif(28 * s, 600, 12), fill=WHITE)
    d.text((pad_l, 188 * s), "PRECINCT.CITY", font=sans(13 * s, 500), fill=WHITE_70)
    d.text(
        (pad_l, h * s - 168 * s),
        "Deliberate\nSurvey\nElicit\nBridge",
        font=sans(15 * s, 500),
        fill=(255, 255, 255, 165),
        spacing=10 * s,
    )

    pad = 56 * s
    x = rail + 40 * s
    max_w = w * s - x - pad
    hf = serif(52 * s if not square else 64 * s, 600, 14)
    y = (120 if not square else 200) * s
    for line in wrap(d, "Structured conversations for better decisions", hf, max_w):
        d.text((x, y), line, font=hf, fill=INK)
        y += int(hf.size * 1.08)

    sub = "For governments, communities, and organisations."
    sf = serif(24 * s, 400, 12)
    y += 22 * s
    for line in wrap(d, sub, sf, max_w):
        d.text((x, y), line, font=sf, fill=INK)
        y += int(sf.size * 1.35)

    y += 32 * s
    paint_cta(d, x, y, "Start a conversation  →", s)
    return im


def paint_split(
    eyebrow: str,
    title: str,
    lead: str,
    foot: str,
    cta: str,
) -> Image.Image:
    im = Image.new("RGB", (W * SCALE, H * SCALE), CREAM)
    d = ImageDraw.Draw(im, "RGBA")
    s = SCALE
    pad = 72 * s
    paint_chrome(d, W, s, pad)

    d.text((pad, 168 * s), eyebrow.upper(), font=sans(14 * s, 500), fill=FOREST)
    tf = serif(52 * s, 600, 14)
    y = 198 * s
    for line in wrap(d, title, tf, W * s - pad * 2):
        d.text((pad, y), line, font=tf, fill=INK)
        y += int(tf.size * 1.1)

    lf = serif(24 * s, 400, 12)
    y += 16 * s
    for line in wrap(d, lead, lf, W * s - pad * 2):
        d.text((pad, y), line, font=lf, fill=INK)
        y += int(lf.size * 1.35)

    y += 24 * s
    paint_cta(d, pad, y, cta, s)

    d.text((pad, H * s - pad), foot, font=sans(15 * s, 500), fill=MOSS)
    return im


def paint_icon(size: int, bg=FOREST, fg=WHITE) -> Image.Image:
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
            "Surface where residents and the department already agree.",
            "Deliberate  ·  Survey  ·  Elicit  ·  Bridge",
            "See the government precinct  →",
        ),
        "government.png",
        (W, H),
    )
    save(
        paint_split(
            "For development",
            "Precinct for Development",
            "Climate, health, livelihoods — and the knowledge plans usually skip.",
            "Deliberate  ·  Survey  ·  Elicit  ·  Bridge",
            "See the development precinct  →",
        ),
        "development.png",
        (W, H),
    )
    save(
        paint_split(
            "For technology",
            "Precinct for Technology",
            "How people meet tools: trust, language, and who belongs in the room.",
            "Deliberate  ·  Survey  ·  Elicit  ·  Bridge",
            "See the technology precinct  →",
        ),
        "technology.png",
        (W, H),
    )
    save(
        paint_split(
            "Interview",
            "A conversation, not a form",
            "Someone asked you to sit with The Precinct. Your answers stay here.",
            "precinct.city",
            "Start this interview  →",
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
            "Join the deliberation  →",
        ),
        "deliberate.png",
        (W, H),
    )

    save(paint_icon(180, bg=FOREST, fg=WHITE), "apple-touch-icon.png", (180, 180))
    save(paint_icon(32, bg=FOREST, fg=WHITE), "favicon-32.png", (32, 32))
    save(paint_icon(512, bg=LEAF_DEEP, fg=WHITE), "icon-512.png", (512, 512))
    copyfile(OUT / "apple-touch-icon.png", ROOT / "public" / "apple-touch-icon.png")
    print("wrote public/apple-touch-icon.png")


if __name__ == "__main__":
    main()
