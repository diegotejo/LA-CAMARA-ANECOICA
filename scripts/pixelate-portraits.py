from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps
except ImportError as exc:
    raise SystemExit("Pillow is required. Run: python -m pip install pillow") from exc


COLOR_GRADES = {
    "lenin": (225, 60, 88),
    "napoleon": (210, 170, 80),
    "aristoteles": (98, 190, 180),
    "isabel": (200, 110, 160),
}


def vignette_mask(size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    center = size / 2
    max_dist = (2 * center) ** 2
    pixels = mask.load()
    for y in range(size):
        for x in range(size):
            dist = ((x - center) ** 2 + (y - center) ** 2)
            shade = int(255 * (1 - dist / max_dist))
            pixels[x, y] = max(0, min(255, shade))
    return mask.filter(ImageFilter.GaussianBlur(radius=18))


def pixelate(image: Image.Image, size: int = 88, final: int = 520) -> Image.Image:
    pixel = image.resize((size, size), Image.NEAREST)
    return pixel.resize((final, final), Image.NEAREST)


def stylize(image: Image.Image, tone: tuple[int, int, int]) -> Image.Image:
    image = ImageOps.autocontrast(image)
    image = ImageEnhance.Contrast(image).enhance(1.18)
    image = ImageEnhance.Color(image).enhance(1.25)

    overlay = Image.new("RGB", image.size, tone)
    image = ImageChops.screen(image, overlay)
    image = ImageEnhance.Brightness(image).enhance(1.05)

    edges = image.filter(ImageFilter.FIND_EDGES)
    edges = ImageEnhance.Brightness(edges).enhance(1.6)
    image = ImageChops.screen(image, edges)

    return image


def process_portrait(path: Path, output_dir: Path) -> None:
    key = path.stem.lower()
    tone = COLOR_GRADES.get(key, (200, 160, 140))

    image = Image.open(path).convert("RGB")
    side = min(image.size)
    image = ImageOps.fit(image, (side, side), centering=(0.5, 0.35))
    image = pixelate(image)
    image = stylize(image, tone)

    vignette = vignette_mask(image.size[0])
    image = Image.composite(image, Image.new("RGB", image.size, (10, 10, 12)), vignette)

    output_path = output_dir / f"{key}.png"
    image.save(output_path)


def main() -> None:
    source_dir = Path("public/brand/portraits/source")
    output_dir = Path("public/brand/portraits")
    output_dir.mkdir(parents=True, exist_ok=True)

    if source_dir.exists():
        sources = [p for p in source_dir.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}]
    else:
        sources = [p for p in output_dir.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}]

    if not sources:
        raise SystemExit("No source images found. Add files to public/brand/portraits or /source")

    for path in sources:
        process_portrait(path, output_dir)


if __name__ == "__main__":
    main()
