"""Turns Google Flow character art into stage sprites.

The source frames live in assets/sprites/raw/<pitch id>/source/, on a flat green background.
tools/sprite_frames.json says which file is which frame, and how to build a frame Flow didn't
give us (for example a mouth-closed frame, made by copying the closed mouth from the blink
frame onto the eyes-open frame). Then:

  python3 tools/sprites.py            # every character in sprite_frames.json
  python3 tools/sprites.py erie       # one character

For each character it:
  1. removes the green background (keyed against the background colour sampled from the edges),
  2. lines every frame up with the anchor frame, since AI edits shift a few pixels,
  3. keeps the anchor and copies over only the region that changed in each other frame (the
     mouth, or the eyes for a blink), so nothing else flickers while the character talks,
  4. crops all frames to the same box, scales them to 1040 px tall, and saves
     assets/sprites/<id>/<frame>.webp, listing them in content/sprites.json.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
RAW = os.path.join(ROOT, "assets", "sprites", "raw")
OUT = os.path.join(ROOT, "assets", "sprites")
INDEX = os.path.join(ROOT, "content", "sprites.json")
PLAN = os.path.join(HERE, "sprite_frames.json")
HEIGHT = 1040


def load(pid, name):
    return np.asarray(Image.open(os.path.join(RAW, pid, "source", name)).convert("RGB")).astype(np.float32)


def key(rgb):
    """RGBA with the green screen removed. The background colour is sampled from the image edges,
    and alpha ramps with colour distance from it, so dark greens in clothing stay solid."""
    edge = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3), rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    bg = np.median(edge, axis=0)
    dist = np.sqrt(((rgb - bg) ** 2).sum(-1))
    alpha = np.clip((dist - 45) / 50, 0, 1)
    # despill: on soft edges, pull green down toward the other channels
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    spill = np.clip(g - np.maximum(r, b), 0, None) * (1 - alpha)
    out = np.dstack([r, g - spill, b, alpha * 255])
    a = Image.fromarray(out[..., 3].astype(np.uint8)).filter(ImageFilter.MinFilter(3))  # trim the halo
    out[..., 3] = np.asarray(a)
    return out


def shift_to(base, img):
    """Integer (dy, dx) that best lines img up with base, by FFT cross-correlation of luminance."""
    A = base[..., :3].mean(-1) * (base[..., 3] / 255)
    B = img[..., :3].mean(-1) * (img[..., 3] / 255)
    A -= A.mean(); B -= B.mean()
    c = np.fft.ifft2(np.fft.fft2(A) * np.conj(np.fft.fft2(B))).real
    dy, dx = np.unravel_index(np.argmax(c), c.shape)
    h, w = c.shape
    return (dy - h if dy > h // 2 else dy), (dx - w if dx > w // 2 else dx)


def roll(img, dy, dx):
    out = np.roll(img, (dy, dx), axis=(0, 1))
    if dy > 0: out[:dy] = 0
    if dy < 0: out[dy:] = 0
    if dx > 0: out[:, :dx] = 0
    if dx < 0: out[:, dx:] = 0
    return out


def feathered(h, w, box, pad):
    x0, y0, x1, y1 = box
    m = np.zeros((h, w), np.uint8)
    m[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad] = 255
    return np.asarray(Image.fromarray(m).filter(ImageFilter.GaussianBlur(pad / 2))).astype(np.float32)[..., None] / 255


def changed_box(base, frame, within=None):
    """Bounding box of the pixels that differ between two aligned frames (optionally inside a box)."""
    diff = np.abs(frame[..., :3] - base[..., :3]).mean(-1) * (np.maximum(frame[..., 3], base[..., 3]) / 255)
    mask = diff > 40
    if within:
        x0, y0, x1, y1 = within
        keep = np.zeros_like(mask); keep[y0:y1, x0:x1] = True
        mask &= keep
    if mask.sum() < 50:
        return None
    ys, xs = np.nonzero(mask)
    y0, y1 = np.percentile(ys, [1, 99]).astype(int)
    x0, x1 = np.percentile(xs, [1, 99]).astype(int)
    return (x0, y0, x1, y1)


def paste(base, frame, box, pad):
    soft = feathered(base.shape[0], base.shape[1], box, pad)
    return base * (1 - soft) + frame * soft


def aligned(anchor, img):
    dy, dx = shift_to(anchor, img)
    return roll(img, dy, dx), (dy, dx)


def process(pid, spec):
    anchor_name = spec["anchor"]
    anchor = key(load(pid, spec["frames"][anchor_name]))
    pad = int(0.012 * anchor.shape[0]) + 4
    frames = {anchor_name: anchor}
    for name, src in spec["frames"].items():
        if name == anchor_name:
            continue
        img, (dy, dx) = aligned(anchor, key(load(pid, src)))
        box = changed_box(anchor, img, spec.get("face"))
        frames[name] = paste(anchor, img, box, pad) if box else anchor.copy()
        print(f"{pid}/{name}: shifted {dy},{dx}, patched {box}")
    for name, how in spec.get("compose", {}).items():
        base = frames[how["base"]]
        donor, (dy, dx) = aligned(anchor, key(load(pid, how["from"])))
        frames[name] = paste(base, donor, how["box"], pad)
        print(f"{pid}/{name}: built from {how['base']} + {how['from']} in {how['box']}")
    alpha = np.max([f[..., 3] for f in frames.values()], axis=0) > 8
    ys, xs = np.nonzero(alpha)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    os.makedirs(os.path.join(OUT, pid), exist_ok=True)
    listed = {}
    for name in ["closed", "mid", "open", "blink"]:
        if name not in frames:
            continue
        im = Image.fromarray(np.clip(frames[name][y0:y1, x0:x1], 0, 255).astype(np.uint8), "RGBA")
        im = im.resize((round(im.width * HEIGHT / im.height), HEIGHT), Image.LANCZOS)
        im.save(os.path.join(OUT, pid, name + ".webp"), quality=88, method=6)
        listed[name] = name + ".webp"
    return listed


def main():
    plan = json.load(open(PLAN))
    pids = sys.argv[1:] or list(plan)
    index = json.load(open(INDEX)) if os.path.exists(INDEX) else {}
    for pid in pids:
        index[pid] = process(pid, plan[pid])
    json.dump(index, open(INDEX, "w"), indent=1)
    print("content/sprites.json:", ", ".join(index) or "(empty)")


if __name__ == "__main__":
    main()
