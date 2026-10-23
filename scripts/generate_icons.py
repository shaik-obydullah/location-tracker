#!/usr/bin/env python3
"""Generate a location-pin themed app icon for LocationTracker."""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icon')
os.makedirs(OUT, exist_ok=True)

# --- Brand colors matching the app theme ---
BG_TOP = (38, 50, 90)      # #26325a
BG_BOTTOM = (19, 24, 51)   # #131833
PIN = (255, 255, 255)      # white pin
PIN_HOLE = (0, 184, 148)   # teal #00b894 accent

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def radial_bg(size, dims):
    img = Image.new('RGB', (size, size))
    px = img.load()
    cx = cy = size / 2.0
    maxr = size * 0.75
    for y in range(size):
        for x in range(size):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / maxr
            d = min(1.0, d)
            t = 0.5 + 0.5 * d
            base = lerp(BG_TOP, BG_BOTTOM, t)
            # vignette shadow toward edges
            shadow = lerp(base, (10, 12, 26), min(1.0, d * 1.2) ** 1.5)
            px[x, y] = tuple(int(c) for c in shadow)
    return img

def draw_pin(draw, cx, cy, pin_size, color, hole_color, hole=True):
    """Draw a teardrop map pin. pin_size is the outer circle diameter."""
    r = pin_size / 2.0
    # head circle
    head = pin_size * 0.92
    draw.ellipse([cx - head/2, cy - head/2, cx + head/2, cy + head/2], fill=color)
    # pointed tail
    tip_y = cy + pin_size * 0.55
    draw.polygon(
        [(cx - head*0.32, cy + head*0.22), (cx + head*0.32, cy + head*0.22), (cx, tip_y)],
        fill=color,
    )
    # inner hole
    if hole:
        hr = pin_size * 0.30
        draw.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=hole_color)

def render(size, path, round_icon=False):
    img = radial_bg(size, size)
    d = ImageDraw.Draw(img)
    if round_icon:
        # content fitted within circular safe area (~76% diameter)
        pin_size = size * 0.42
    else:
        # full-bleed legacy icon, pin sized for masked view
        pin_size = size * 0.62
    cy = size * 0.44
    draw_pin(d, size/2, cy, pin_size, PIN, PIN_HOLE)
    img.save(path, 'PNG')
    print('wrote', path)

# --- Android mipmaps ---
for name, size in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    render(size, os.path.join(d, 'ic_launcher.png'), round_icon=False)
    render(size, os.path.join(d, 'ic_launcher_round.png'), round_icon=True)

# --- iOS AppIcon set (single 1024 for iOS16+ single-size) ---
ios_dir = os.path.join(OUT, 'ios')
os.makedirs(ios_dir, exist_ok=True)
render(1024, os.path.join(ios_dir, 'icon-1024.png'), round_icon=False)
for name, size in [('40', 40), ('60', 60), ('58', 58), ('87', 87), ('80', 80),
                   ('120', 120), ('180', 180), ('20', 20), ('29', 29), ('76', 76),
                   ('152', 152), ('167', 167)]:
    render(size, os.path.join(ios_dir, f'icon-{name}.png'), round_icon=False)
print('done')