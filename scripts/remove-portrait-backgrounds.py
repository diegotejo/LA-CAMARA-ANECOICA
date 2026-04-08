from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image, ImageFilter
except ImportError as exc:
    raise SystemExit("Pillow is required. Run: python -m pip install pillow") from exc


PORTRAITS = ["lenin.png", "napoleon.png", "aristoteles.png", "isabel.png"]
THRESHOLD = 30
SOFTEN = 18
BLUR_RADIUS = 1.0
ALPHA_CUTOFF = 120


def build_alpha_mask(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    mask = Image.new("L", rgb.size, 0)
    alpha_values = []

    for r, g, b in rgb.get_flattened_data():
        luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        if luminance <= THRESHOLD:
            alpha = 0
        elif luminance >= THRESHOLD + SOFTEN:
            alpha = 255
        else:
            alpha = int(255 * (luminance - THRESHOLD) / SOFTEN)
        alpha_values.append(alpha)

    mask.putdata(alpha_values)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))
    return mask.point(lambda value: 0 if value < ALPHA_CUTOFF else value)


def remove_background(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha_mask = build_alpha_mask(image)
    image.putalpha(alpha_mask)
    image.save(path)


def main() -> None:
    base_dir = Path("public/brand/portraits")
    for name in PORTRAITS:
        target = base_dir / name
        if target.exists():
            remove_background(target)


if __name__ == "__main__":
    main()
