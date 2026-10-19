# The Eastgate Tank

A Shark Tank-style investing game for AP Human Geography, Unit 3 (cultural landscape, topic 3.2). Students hear a briefing on Eastgate, a fictional Chicago-style neighborhood, then five pitches for what its empty 1893 church hall should become. They invest $1,000 as they go, then see what happened in **Five Years Later**.

It runs exactly like The Tank (`ethomasclass/transportrevshark`), with one addition: a narrated neighborhood briefing before the first pitch.

**Concepts:** ethnic enclaves (choice vs. segregation), charter group, sequent occupancy, neolocalism, gendered space, reactions to new residents, perceptual regions.

## Using it in class

- **Class game (projector).** Open the site and choose *Start class game*.
  1. **The briefing.** Dolores Vega of the Eastgate Historical Society walks students through the block: the Czech cornerstone, the Spanish sign painted over a Czech beer ad, language change by decade, the three names for the neighborhood, the women's circle, the dark stretch at night, rents and the sidewalk vendors. Every clue that decides a payout is planted here. (*Skip the briefing* is there if you need it.)
  2. **For each pitch:** the pitcher walks in with a prospectus, the pitch plays with captions and exhibits on the easel, the class picks 2 questions from a bank of 6, and students write their investment on the worksheet.
  3. After the last pitch, **Five Years Later** (teacher password) shows one front page of *The Eastgate Courier* per venture, a "why it mattered" card with the Unit 3 concepts, the big picture, and the payout table.
- **Pitch order** is shuffled for each period and saved, so one class can't tip off the next. Reshuffle in Teacher tools.
- **The neighborhood** button on every question and decision screen reopens the briefing exhibits.
- **Catch-up (absent students):** the same game on their own device, in a shuffled order, investing on screen.
- **Teacher tools** (password): period, pitch order, questions per pitch, decision clock, music, a math-check calculator, a class leaderboard, and debrief notes (the clues in every pitch and what each answer gives away).
- **Worksheet:** `handout.html`, printable, two pages, with a box for the briefing clues.

**Payouts** (made per $1): The Landing +3, Eastgate Brewing +2, Mercado Vine +1, The Residences at Vine 0, Little Prague Experience −1.

Settings, runs and leaderboards are saved in the browser (localStorage, under `eastgate.*` keys so they never collide with The Tank on the same site), so set up the game on the projector computer.

## Where things live

| What | File |
|---|---|
| Briefing and pitch scripts (the 90-second takes) | `content/scripts.json` |
| Pitchers, prospectus, briefing card | `content/pitches.json` |
| Easel exhibits (title, lead, facts, the script word that shows each one, and an image or card) | `content/exhibits.json` |
| Google Flow images used on the easel and front pages | `assets/img/` |
| Drawn data cards (language by decade, three names, 7 in 10, rent vs. income...) | `js/art/cards.js` |
| Question bank (questions and in-character answers) | `content/faq.json` |
| Payouts, front pages, concepts, clues, answer notes, debrief | `content/teacher.enc.json` (encrypted) |
| Voiced takes and word timings | `assets/audio/` |
| Character sprites (cut out of the Flow portraits in `assets/sprites/raw/flow/`) | `assets/sprites/<id>/`, `content/sprites.json` |

### Teacher-only content is encrypted

```sh
node tools/teacher_bundle.mjs decrypt   # asks for the password; writes content/teacher.json (git-ignored)
# edit content/teacher.json
node tools/teacher_bundle.mjs encrypt   # a different password here changes it
```

### Voices

Voiced with ElevenLabs `eleven_v3` by `tools/voice.py` (voices, delivery tags and pronunciations at the top of that file). Put `ELEVENLABS_API_KEY=...` in `tools/.env` (git-ignored), then `python3 tools/voice.py` or `python3 tools/voice.py mercado`. Unchanged text is cached and costs nothing.

| Character | Voice |
|---|---|
| Dolores Vega (briefing) | Grandma Maria |
| Rosario Medina (Mercado Vine) | Laura |
| Cole Brennan (Eastgate Brewing) | Drew |
| Maggie Alvarez-Novak (The Landing) | Lina |
| Brent Hollis-Whitcomb (Residences) | Daniel |
| Gerry Dvorak (Little Prague) | Eddie |

## Hosting

`.github/workflows/pages.yml` publishes to GitHub Pages on every push to `main`. Turn it on once under **Settings → Pages → Source: GitHub Actions**. To try it locally, use a static server that supports range requests (needed for seeking in the audio), e.g. `npx http-server`.
