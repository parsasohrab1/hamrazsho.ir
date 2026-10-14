"""
Export the segmented brand mark (six pillar circles) as SVG + PNG.

Geometry and colors mirror mental-wellness-assistant/src/components/BrandMark.tsx
and src/config/segments.ts — keep them in sync.

Variants:
  yavar-segmented-all       all six circles in color (no topic known)
  yavar-segmented-<pillar>  same shape; only that pillar's circle in color,
                            with its name inside; the others in grayscale

Run:  python export_segmented_logo.py
Needs: Pillow, arabic_reshaper, python-bidi (Persian shaping for the PNGs).
"""
import math
import os

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))

VIEW = 200
R, OFFSET = 30, 62
CENTER_R, CENTER_COLOR = 12, "#FAF0DC"
BG = "#0D1424"

SEGMENTS = [
    ("mind", "روح و روان", "#0EA5A4", "#8A8A8A"),
    ("family", "خانواده", "#F5A623", "#B4B4B4"),
    ("legal", "حقوقی", "#E4577B", "#8F8F8F"),
    ("business", "کسب‌وکار", "#6366F1", "#707070"),
    ("academic", "تحصیلی", "#22C55E", "#A0A0A0"),
    ("sport", "ورزشی", "#38BDF8", "#9A9A9A"),
]
# one polygon corner per pillar, starting at the top, clockwise
POSITIONS = [
    (math.cos(math.radians(-90 + k * 360 / len(SEGMENTS))), math.sin(math.radians(-90 + k * 360 / len(SEGMENTS))))
    for k in range(len(SEGMENTS))
]

FONT_CANDIDATES = [
    os.path.join(HERE, "Vazirmatn-Bold.ttf"),
    r"C:\Windows\Fonts\tahomabd.ttf",
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
]


def font(size):
    for f in FONT_CANDIDATES:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def blend(hex_color, opacity, bg=BG):
    """Pre-multiply an opacity onto the background (PNG export has no alpha stacking)."""
    c = [int(hex_color[i : i + 2], 16) for i in (1, 3, 5)]
    b = [int(bg[i : i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(b[i] + (c[i] - b[i]) * opacity):02x}" for i in range(3))


def circles(active):
    out = []
    c = VIEW / 2
    for i, (sid, _, color, gray) in enumerate(SEGMENTS):
        dx, dy = POSITIONS[i]
        fill = color if active in (None, sid) else blend(gray, 0.55)
        out.append((c + dx * OFFSET, c + dy * OFFSET, R, fill))
    out.append((c, c, CENTER_R, CENTER_COLOR))
    return out


def svg(active):
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW} {VIEW}">']
    for cx, cy, r, fill in circles(active):
        parts.append(f'<circle cx="{cx:g}" cy="{cy:g}" r="{r}" fill="{fill}"/>')
    if active:
        i = [s[0] for s in SEGMENTS].index(active)
        dx, dy = POSITIONS[i]
        label = SEGMENTS[i][1]
        fs = 10 if len(label) > 7 else 13
        parts.append(
            f'<text x="{VIEW/2 + dx*OFFSET:g}" y="{VIEW/2 + dy*OFFSET:g}" fill="#fff" '
            f'font-family="Vazirmatn, Tahoma, sans-serif" font-weight="800" font-size="{fs}" '
            f'text-anchor="middle" dominant-baseline="central" direction="rtl">{label}</text>'
        )
    parts.append("</svg>")
    return "\n".join(parts)


def png(active, px=1024, background=None):
    s = px / VIEW
    ss = 4  # supersample for smooth edges
    img = Image.new("RGBA", (px * ss, px * ss), background or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for cx, cy, r, fill in circles(active):
        k = s * ss
        d.ellipse([(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k], fill=fill)
    if active:
        i = [x[0] for x in SEGMENTS].index(active)
        dx, dy = POSITIONS[i]
        text = get_display(arabic_reshaper.reshape(SEGMENTS[i][1]))
        f = font(int((10 if len(SEGMENTS[i][1]) > 7 else 13) * s * ss))
        cx, cy = (VIEW / 2 + dx * OFFSET) * s * ss, (VIEW / 2 + dy * OFFSET) * s * ss
        d.text((cx, cy), text, fill="#ffffff", font=f, anchor="mm")
    return img.resize((px, px), Image.LANCZOS)


def main():
    variants = [None] + [s[0] for s in SEGMENTS]
    for v in variants:
        name = f"yavar-segmented-{v or 'all'}"
        with open(os.path.join(HERE, name + ".svg"), "w", encoding="utf8") as f:
            f.write(svg(v))
        png(v).save(os.path.join(HERE, name + ".png"))
        png(v, background=BG).save(os.path.join(HERE, name + "-on-dark.png"))
    # contact sheet for quick review
    sheet = Image.new("RGB", (len(variants) * 300, 300), BG)
    for k, v in enumerate(variants):
        sheet.paste(png(v, 280, background=BG).convert("RGB"), (k * 300 + 10, 10))
    sheet.save(os.path.join(HERE, "yavar-segmented-sheet.png"))
    print("exported", len(variants), "variants")


if __name__ == "__main__":
    main()
