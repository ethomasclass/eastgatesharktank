# Character sprites in Google Flow

Each promoter needs **3 frames** (mouth closed, half open, wide open) and optionally a **4th** (eyes closed, for blinking). The stage flips between them in time with the voice, so it looks like the character is talking. Until the art exists, the site uses the simple SVG cartoons in `js/chars.js`. Those drawings follow the same briefs, so they double as a rough preview.

## The look

**A 19th-century political cartoon, redrawn as a clean modern cartoon.** Big heads, thick ink outlines, flat period colors: something between a *Puck* magazine caricature and a modern animated explainer.

- **It suits the trick.** Swapping mouth frames looks deliberate in a cartoon, like limited animation. In a realistic style it looks uncanny.
- **It holds together.** AI editors keep a bold, flat style far more consistent from one frame to the next than a painterly or photographic one.
- **It fits the period.** Early-republic caricature is a real 1790s–1830s look, not a modern costume.
- **It reads on a projector.** Big features and strong outlines survive a washed-out classroom screen.

The dud has to look as trustworthy as the winners, so no villain eyebrows for Colonel Tibbs.

## Step 1: the base frame (mouth closed)

In Flow, create an image (Nano Banana or Imagen). Use **portrait** framing if offered, or square. Paste the **style block** followed by **one character block**.

**Style block** (the same for all five characters, so they match):

> Bold cartoon caricature in the spirit of a 19th-century hand-inked political cartoon, redrawn as a clean modern flat illustration. Thick, even black ink outlines. Flat colors with a single soft shadow tone. Muted early-American palette: sepia, cream, oxblood red, navy, brass, forest green, with a faint paper grain on the character only. Oversized head, about one third of the body height, with big readable features and expressive eyebrows. Waist-up, centered, facing the viewer at a slight three-quarter angle, with the whole hat visible and space above it. Plain solid flat chroma-key green background (#00B140), no shadow on the background, no text, no frame, no other people. Mouth closed.

**Character blocks:**

1. **Abner Keller** (Turnpike, 1792)
   > An older Pennsylvania German wheat farmer, about 60, with a weathered tan face and a grey chin-curtain beard (no mustache). Heavy flat eyebrows, small tired eyes, a dry, deadpan, unimpressed expression. Wide flat-brimmed black felt hat, plain brown wool coat, cream linen shirt, dark suspenders. Hands relaxed at his sides.

2. **Ezekiel Thorne** (Slater's Mill, 1792)
   > A thin English-born merchant's agent, about 40, with a sly, knowing half-smile, one eyebrow raised and eyes glancing sideways as if sharing a secret. Small round wire spectacles, dark tricorn hat, brown hair tied back. Dark green frock coat, white ruffled cravat. Leaning in slightly, one finger raised near his lips.

3. **Barnaby Finch** (Steamboat, 1808)
   > A young fast-talking showman, about 25, with a huge toothy grin, wild curly red hair, freckles and eyebrows raised high. Tall red top hat tilted at a jaunty angle, bright red tailcoat, yellow-and-cream striped waistcoat, gold bow tie. One arm flung out in a "step right up" gesture.

4. **Commissioner Augustus Vale** (Erie Canal, 1817)
   > A large, proud politician, about 55, with a big round face, bushy grey mutton-chop sideburns, a clean-shaven chin and heavy grey brows. His chin is lifted grandly. Tall black stovepipe top hat, navy frock coat with brass buttons, red sash across his chest, high white collar. A rolled-up map held in one hand.

5. **Colonel Roscoe Tibbs** (Northern Cross Railroad, 1837)
   > A jolly, friendly land booster, about 50, with rosy cheeks, a big warm smile and twinkling, crinkled eyes. White handlebar mustache and a small white goatee. Wide-brimmed white planter's hat, cream-white suit, black string tie, one thumb hooked in his lapel. He looks trustworthy and likeable.

Generate a few, pick the best, and **use that same image for every edit below**.

## Step 2: the mouth and blink frames (edits of the base)

Edit the chosen base image (use it as the ingredient or reference) with each of these prompts:

- **Half open**
  > Edit this exact image. Keep the character, pose, hat, clothes, colors, framing, outline style and green background exactly the same. Change only the mouth: slightly open, as if saying "eh", showing a little of the top teeth.
- **Wide open**
  > Edit this exact image. Keep everything exactly the same. Change only the mouth: wide open, as if saying "ah", with the tongue visible.
- **Blink** (optional)
  > Edit this exact image. Keep everything exactly the same, including the closed mouth. Change only the eyes: fully closed and relaxed, mid-blink.

For Keller, Vale and Tibbs, the facial hair has to move with the mouth. If an edit redraws the whole beard, try again, or keep the result anyway. The script below copies over only the part that changed.

It's fine if a frame comes out a few pixels off or slightly different outside the mouth. The script lines the frames up and can paste in just the mouth area.

## Step 3: hand them over

Upload the frames anywhere in the repo (or in chat). I file them under `assets/sprites/raw/<pitch id>/source/` and record which file is which frame in `tools/sprite_frames.json`. That manifest can also build a missing frame. For example, Finch, Vale and Tibbs had no "eyes open, mouth closed" frame, so theirs is the eyes-open frame with the closed mouth copied in from the blink frame. Then:

```sh
python3 tools/sprites.py        # all characters; or: python3 tools/sprites.py erie
```

That removes the green, lines the frames up, keeps only the changed mouth or eyes from each edit, and writes `assets/sprites/<id>/*.webp` plus `content/sprites.json`. A character without a half-open frame (Keller) flaps between closed and open. Any character missing from `content/sprites.json` falls back to its SVG stand-in.

## Optional extras in Flow

- **"Where are they now?" portraits:** the same character years later. For example, Tibbs with an empty pocket turned out, Vale beside a busy canal, or Keller unchanged and still deadpan. These would go on the newspaper cards.
- **A hallway walk-in:** a 3–4 second Veo clip of each character walking toward the camera down a gaslit hallway, played before each pitch.
