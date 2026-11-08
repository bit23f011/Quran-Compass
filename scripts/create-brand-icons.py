"""Prepare icons from the supplied artwork without redrawing its calligraphy."""
from pathlib import Path
import argparse
import base64
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
args = parser.parse_args()
assets = Path(__file__).resolve().parent.parent / "assets"
art = Image.open(args.source).convert("RGBA")
# The supplied PNG is transparent. If another copy has an opaque black backdrop,
# remove black alone; retain the exact olive and gold colour channels.
if art.getpixel((0, 0))[3] != 0:
    art.putdata([(r, g, b, 0 if r == g == b == 0 else a) for r, g, b, a in art.getdata()])
art.save(assets / "brand-logo.png", optimize=True)

def icon(size, artwork_size, background):
    image = Image.new("RGBA", (size, size), background)
    scaled = art.copy()
    scaled.thumbnail((artwork_size, artwork_size), Image.Resampling.LANCZOS)
    image.alpha_composite(scaled, ((size-scaled.width)//2, (size-scaled.height)//2))
    return image

icon(64, 62, (233, 224, 204, 255)).save(assets / "favicon.png", optimize=True)
icon(192, 176, (233, 224, 204, 255)).save(assets / "icon-192.png", optimize=True)
# The whole gold ring fits the maskable safe area (central 80% circle).
icon(512, 408, (233, 224, 204, 255)).save(assets / "icon-512.png", optimize=True)
small = icon(192, 176, (233, 224, 204, 255))
from io import BytesIO
data = BytesIO()
small.save(data, format="PNG", optimize=True)
encoded = base64.b64encode(data.getvalue()).decode("ascii")
(assets / "icon.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">'
    '<image width="192" height="192" href="data:image/png;base64,' + encoded + '"/></svg>\n',
    encoding="utf-8"
)
print("Prepared transparent brand artwork, favicon and two PWA icons from supplied logo.")
