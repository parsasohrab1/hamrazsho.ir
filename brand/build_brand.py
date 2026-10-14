"""Generates every Hamraz logo asset: SVGs, PNG exports, TS wordmark.

Run:  python build_brand.py   (needs Pillow + fontTools).
The wordmark outlines come from the Windows "Dubai Bold" font. Swap FONT (or
hand-draw the lettering) for a licensed / custom face before trademark filing.
"""
import math
import os
import shutil

from fontTools.pens.basePen import BasePen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, "..", "mental-wellness-assistant")
FONT = "C:/Windows/Fonts/DUBAI-BOLD.TTF"
LAPIS, TURQ, GOLD, IVORY, NIGHT = "#16245C", "#2BB3AA", "#E0A93B", "#F7F1E3", "#0B1233"

# ---- mark geometry (100x100 box): two rings, the shared lens is the secret --
D, R, SW = 11.0, 23.0, 6.5  # half distance between centers, ring radius, stroke
LX, RX, CY = 50 - D, 50 + D, 50.0
LH = math.sqrt(R * R - D * D)  # lens half-height
LENS = f"M50 {CY - LH:.2f} A{R} {R} 0 0 0 50 {CY + LH:.2f} A{R} {R} 0 0 0 50 {CY - LH:.2f}Z"


def mark_svg(left=IVORY, right=TURQ, lens=GOLD):
    return (
        f'<path d="{LENS}" fill="{lens}"/>'
        f'<circle cx="{LX}" cy="{CY}" r="{R}" fill="none" stroke="{left}" stroke-width="{SW}"/>'
        f'<circle cx="{RX}" cy="{CY}" r="{R}" fill="none" stroke="{right}" stroke-width="{SW}"/>'
    )


# ---- wordmark outlines ------------------------------------------------------
tt = TTFont(FONT)
gs = tt.getGlyphSet()
cm = tt.getBestCmap()
SEQ = [0xFEEB, 0xFEE4, 0xFEAE, 0xFE8E, 0xFEB0]  # ه م ر ا ز (RTL contextual forms)
ZEH = 0xFEB0


class Flat(BasePen):
    def __init__(self, gset):
        super().__init__(gset)
        self.polys, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, a, b, c):
        p0 = self.cur[-1]
        for i in range(1, 13):
            t = i / 12
            u = 1 - t
            self.cur.append(
                (
                    u**3 * p0[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t**3 * c[0],
                    u**3 * p0[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t**3 * c[1],
                )
            )

    def _qCurveToOne(self, a, b):
        p0 = self.cur[-1]
        for i in range(1, 11):
            t = i / 10
            u = 1 - t
            self.cur.append(
                (u * u * p0[0] + 2 * u * t * a[0] + t * t * b[0], u * u * p0[1] + 2 * u * t * a[1] + t * t * b[1])
            )

    def _closePath(self):
        self.polys.append(self.cur)
        self.cur = []

    _endPath = _closePath


def bbox_area(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return (max(xs) - min(xs)) * (max(ys) - min(ys))


contours = []  # (flattened polygon in font units, is_dot)
x = 0
for u in SEQ:
    g = cm[u]
    x -= gs[g].width
    f = Flat(gs)
    gs[g].draw(f)
    polys = [[(px + x, py) for px, py in p] for p in f.polys]
    smallest = min(bbox_area(p) for p in polys)
    for p in polys:
        contours.append((p, u == ZEH and len(polys) > 1 and bbox_area(p) == smallest))
allx = [q[0] for p, _ in contours for q in p]
ally = [q[1] for p, _ in contours for q in p]
WX0, WX1, WY0, WY1 = min(allx), max(allx), min(ally), max(ally)
WW, WH = WX1 - WX0, WY1 - WY0


def fmt(v):
    return ("%.1f" % v).rstrip("0").rstrip(".")


def wordmark_paths():
    """SVG path data in a 0 0 WW WH viewBox: (body, dot)."""
    body, dot = [], []
    x = 0
    for u in SEQ:
        g = cm[u]
        x -= gs[g].width
        rp = DecomposingRecordingPen(gs)
        gs[g].draw(rp)
        cs, cur = [], []
        for op, args in rp.value:
            cur.append((op, args))
            if op in ("closePath", "endPath"):
                cs.append(cur)
                cur = []

        def area(c):
            return bbox_area([pt for _, a in c for pt in a])

        small = min(cs, key=area) if (u == ZEH and len(cs) > 1) else None
        for c in cs:
            pen = SVGPathPen(None, ntos=fmt)
            tp = TransformPen(pen, (1, 0, 0, -1, x - WX0, WY1))
            for op, a in c:
                getattr(tp, op)(*a)
            (dot if c is small else body).append(pen.getCommands())
    return " ".join(body), " ".join(dot)


BODY, DOT = wordmark_paths()


def wordmark_group(fill, dotfill, h):
    s = h / WH
    return f'<g transform="scale({s:.5f})"><path d="{BODY}" fill="{fill}"/><path d="{DOT}" fill="{dotfill}"/></g>', WW * s


# ---- SVG files ----------------------------------------------------------------
def write(name, txt):
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as fh:
        fh.write(txt)


write("hamraz-mark.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">{mark_svg()}</svg>')
write(
    "hamraz-icon.svg",
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512"><rect width="100" height="100" rx="24" fill="{LAPIS}"/>{mark_svg()}</svg>',
)


def lockup(textfill, dotfill, tile, bg=None):
    th, gap, ih = 46, 26, 100
    wg, tw = wordmark_group(textfill, dotfill, th)
    W = tw + gap + ih
    ty = (ih - th) / 2
    rect = f'<rect x="-12" y="-12" width="{W + 24:.0f}" height="{ih + 24}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 {W + 24:.0f} {ih + 24}" width="{(W + 24) * 3:.0f}" height="{(ih + 24) * 3}">{rect}'
        f'<g transform="translate(0,{ty:.2f})">{wg}</g>'
        f'<g transform="translate({tw + gap:.2f},0)"><rect width="100" height="100" rx="24" fill="{tile}"/>{mark_svg()}</g></svg>'
    )


write("hamraz-logo.svg", lockup(LAPIS, GOLD, LAPIS))
write("hamraz-logo-dark.svg", lockup(IVORY, GOLD, LAPIS, NIGHT))

# ---- TS wordmark for the app ----------------------------------------------------
with open(os.path.join(APP, "src/config/brandWordmark.ts"), "w", encoding="utf-8") as fh:
    fh.write(
        "// GENERATED by brand/build_brand.py - do not edit by hand.\n"
        "// Outlined Persian wordmark of the brand name; the dot of its last letter is\n"
        "// a separate path so it can be drawn in gold.\n"
        f'export const WORDMARK = {{\n  width: {WW:.0f},\n  height: {WH:.0f},\n  body: "{BODY}",\n  dot: "{DOT}",\n}};\n'
    )

# ---- PNG rendering -----------------------------------------------------------------
SS = 4


def hexc(h, a=255):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (a,)


def lens_poly(k, ox, oy):
    th = math.asin(LH / R)
    pts = []
    for i in range(41):
        t = -th + 2 * th * i / 40
        pts.append((RX - R * math.cos(t), CY + R * math.sin(t)))
    for i in range(41):
        t = th - 2 * th * i / 40
        pts.append((LX + R * math.cos(t), CY + R * math.sin(t)))
    return [(ox + px * k, oy + py * k) for px, py in pts]


def draw_mark(img, k, ox, oy, left=IVORY, right=TURQ, lens=GOLD):
    d = ImageDraw.Draw(img)
    d.polygon(lens_poly(k, ox, oy), fill=hexc(lens))
    for cx, col in ((LX, left), (RX, right)):
        d.ellipse(
            [ox + (cx - R - SW / 2) * k, oy + (CY - R - SW / 2) * k, ox + (cx + R + SW / 2) * k, oy + (CY + R + SW / 2) * k],
            outline=hexc(col),
            width=int(round(SW * k)),
        )


def signed_area(poly):
    return sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1] for i in range(len(poly))) / 2


# Per glyph: outer contours share the sign of the largest contour, holes the opposite.
def draw_word(img, h, ox, oy, fill=IVORY, dotfill=GOLD):
    s = h / WH
    ref = max(contours, key=lambda c: abs(signed_area(c[0])))
    ref_sign = signed_area(ref[0]) > 0

    def tp(poly):
        return [(ox + (px - WX0) * s, oy + (WY1 - py) * s) for px, py in poly]

    for dot_pass in (False, True):
        outer = Image.new("1", img.size, 0)
        holes = Image.new("1", img.size, 0)
        for poly, is_dot in contours:
            if is_dot != dot_pass:
                continue
            is_outer = (signed_area(poly) > 0) == ref_sign
            target = outer if is_outer else holes
            ImageDraw.Draw(target).polygon(tp(poly), fill=1)
        m = ImageChops.subtract(outer.convert("L"), holes.convert("L"))
        img.paste(Image.new("RGBA", img.size, hexc(dotfill if dot_pass else fill)), (0, 0), m)


def render(size, bg=LAPIS, rounded=0.0, mark_scale=0.9, transparent=False):
    S = size * SS
    if transparent or rounded:
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        if rounded and not transparent:
            ImageDraw.Draw(img).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * rounded), fill=hexc(bg))
    else:
        img = Image.new("RGBA", (S, S), hexc(bg))
    k = S / 100 * mark_scale
    off = (S - 100 * k) / 2
    draw_mark(img, k, off, off)
    return img.resize((size, size), Image.LANCZOS)


def save(img, *path, mode=None):
    p = os.path.join(HERE, "exports", *path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    (img.convert(mode) if mode else img).save(p)


save(render(1024), "icon-1024-flat.png", mode="RGB")
save(render(1024, mark_scale=0.58, transparent=True), "adaptive-icon-foreground-1024.png")
save(render(432, mark_scale=0.58, transparent=True), "android", "adaptive-foreground-432.png")
save(render(512), "android", "playstore-icon-512.png", mode="RGB")
for name, px in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)):
    save(render(px, rounded=0.22), "android", f"ic_launcher-{name}-{px}.png")
for px in (20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024):
    save(render(px), "ios", f"AppIcon-{px}.png", mode="RGB")
for px in (16, 32, 48, 180, 192, 512):
    save(render(px, rounded=0.22 if px < 100 else 0.0), f"web-icon-{px}.png")
render(256, rounded=0.22).save(os.path.join(HERE, "exports", "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# splash: night background, mark above the wordmark
S = 2048
sp = Image.new("RGBA", (S, S), hexc(NIGHT))
k = S / 100 * 0.42
draw_mark(sp, k, (S - 100 * k) / 2, S * 0.17)
wh = S * 0.13
draw_word(sp, wh, (S - WW * wh / WH) / 2, S * 0.60)
save(sp.resize((1024, 1024), Image.LANCZOS), "splash-1024.png", mode="RGB")

# push into the Expo app + PWA
E = lambda *p: os.path.join(HERE, "exports", *p)
shutil.copy(E("icon-1024-flat.png"), os.path.join(APP, "assets/icon.png"))
shutil.copy(E("adaptive-icon-foreground-1024.png"), os.path.join(APP, "assets/adaptive-icon-foreground.png"))
shutil.copy(E("splash-1024.png"), os.path.join(APP, "assets/splash.png"))
shutil.copy(E("web-icon-512.png"), os.path.join(APP, "assets/favicon.png"))
shutil.copy(E("web-icon-192.png"), os.path.join(APP, "public/icon-192.png"))
shutil.copy(E("web-icon-512.png"), os.path.join(APP, "public/icon-512.png"))
print("done; wordmark", WW, WH)
