"""Builds talking sprites from Google Flow frames on a WHITE background.

  python3 tools/frames_white.py <pid> <closed.jpg> [mid.jpg] [open.jpg] [blink.jpg]

The closed-mouth portrait is cut out (flood fill from the border), and each other frame is lined
up with it; only the region that changed (mouth or eyes) is copied over, so the body never
jitters between frames. Writes assets/sprites/<pid>/{closed,mid,open,blink}.webp and updates
content/sprites.json.
"""
import json, os, sys
import cv2, numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


def load(p):
    return np.array(Image.open(p).convert('RGB'))


def mask_white(im):
    hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV)
    cand = ((im.min(axis=2) > 225) & (hsv[..., 1] < 40)).astype(np.uint8)
    n, lab = cv2.connectedComponents(cand, connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = (~np.isin(lab, list(border))).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
    keep = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    m = (lab == keep).astype(np.uint8) * 255
    return cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))


def align(ref, im):
    """Translation-only alignment of im onto ref (frames from one edit are near-identical)."""
    if im.shape != ref.shape:
        im = cv2.resize(im, (ref.shape[1], ref.shape[0]), interpolation=cv2.INTER_AREA)
    a = cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY).astype(np.float32)
    b = cv2.cvtColor(im, cv2.COLOR_RGB2GRAY).astype(np.float32)
    (dx, dy), _ = cv2.phaseCorrelate(a, b)
    M = np.float32([[1, 0, -dx], [0, 1, -dy]])
    return cv2.warpAffine(im, M, (ref.shape[1], ref.shape[0]), borderValue=(255, 255, 255))


def changed_box(ref, im, head):
    """Bounding box of the pixels that changed, searched only in the head region."""
    x0, y0, x1, y1 = head
    d = cv2.absdiff(ref[y0:y1, x0:x1], im[y0:y1, x0:x1]).max(axis=2)
    d = cv2.GaussianBlur(d, (5, 5), 0)
    m = (d > 40).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n <= 1:
        return None
    # keep components that are reasonably big; union their boxes
    idx = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 30]
    if not idx:
        return None
    xs = [st[i, 0] for i in idx] + [st[i, 0] + st[i, 2] for i in idx]
    ys = [st[i, 1] for i in idx] + [st[i, 1] + st[i, 3] for i in idx]
    pad = 10
    return (x0 + max(0, min(xs) - pad), y0 + max(0, min(ys) - pad), x0 + max(xs) + pad, y0 + max(ys) + pad)


def main():
    pid, closed = sys.argv[1], sys.argv[2]
    others = dict(zip(['mid', 'open', 'blink'], sys.argv[3:]))
    ref = load(closed)
    m = mask_white(ref)
    ys, xs = np.where(m > 0)
    bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
    # head region: top 30% of the figure, central 70% of its width
    fh, fw = by1 - by0, bx1 - bx0
    head = (int(bx0 + fw * 0.1), int(by0), int(bx1 - fw * 0.1), int(by0 + fh * 0.32))
    frames = {'closed': ref}
    for k, p in others.items():
        if not p or not os.path.exists(p):
            continue
        im = align(ref, load(p))
        box = changed_box(ref, im, head)
        out = ref.copy()
        if box:
            x0, y0, x1, y1 = box
            # feathered paste so the seam never shows
            fm = np.zeros(ref.shape[:2], np.float32)
            fm[y0:y1, x0:x1] = 1
            fm = cv2.GaussianBlur(fm, (15, 15), 0)[..., None]
            out = (im * fm + ref * (1 - fm)).astype(np.uint8)
            print(f'{pid} {k}: patched {box}')
        else:
            print(f'{pid} {k}: no change found, skipped')
            continue
        frames[k] = out
    alpha = cv2.GaussianBlur(m, (3, 3), 0)
    crop = (slice(by0, by1 + 1), slice(bx0, bx1 + 1))
    ch, cw = by1 - by0 + 1, bx1 - bx0 + 1
    H = int(ch * 1.04); W = max(int(H * 400 / 520), cw + 20)
    if W * 520 / 400 > H:
        H = int(W * 520 / 400)
    od = os.path.join(ROOT, 'assets', 'sprites', pid)
    os.makedirs(od, exist_ok=True)
    names = {}
    for k, im in frames.items():
        rgba = np.dstack([im, alpha])[crop]
        canvas = np.zeros((H, W, 4), np.uint8)
        ox, oy = (W - cw) // 2, H - ch
        canvas[oy:oy + ch, ox:ox + cw] = rgba
        img = Image.fromarray(canvas)
        img.thumbnail((800, 1040), Image.LANCZOS)
        img.save(os.path.join(od, f'{k}.webp'), quality=90)
        names[k] = f'{k}.webp'
    idx_p = os.path.join(ROOT, 'content', 'sprites.json')
    idx = json.load(open(idx_p)) if os.path.exists(idx_p) else {}
    idx[pid] = names
    json.dump(idx, open(idx_p, 'w'), indent=1)
    print(pid, sorted(names))


if __name__ == '__main__':
    main()
