"""Voices the pitches: content/scripts.json -> assets/audio/<id>-short.mp3 plus
<id>-short.words.json (each word of the on-screen script with its start and end time).

  python3 tools/voice.py                  # every pitch (the 90-second cuts)
  python3 tools/voice.py erie             # one pitch

The scripts stay clean: the delivery tags below (eleven_v3 audio tags such as [whispers]) and the
spoken forms of numbers are added only to the copy that is sent to ElevenLabs. Responses are
cached in tools/cache/, so re-running on unchanged text costs nothing.
"""
import json, os, re, subprocess, sys
import eleven

ROOT = os.path.join(eleven.HERE, "..")
OUT = os.path.join(ROOT, "assets", "audio")
try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG = "ffmpeg"

# Chosen from the ElevenLabs voice library for the Eastgate cast.
VOICES = {
    "briefing":     {"id": "A0g6t0RQc9zkMPsGNEIG", "name": "Grandma Maria", "stability": 0.5},
    "mercado":      {"id": "FGLJyeekUzxl8M3CTG9M", "name": "Laura",         "stability": 0.5},
    "brewery":      {"id": "q0IMILNRPxOgtBTS4taI", "name": "Drew",          "stability": 0.0},
    "landing":      {"id": "oWjuL7HSoaEJRMDMP3HD", "name": "Lina",          "stability": 0.5},
    "residences":   {"id": "b6Q4e5E5onTR1TYEJh9z", "name": "Daniel",        "stability": 0.0},
    "littleprague": {"id": "cIOaiiemAqOmrhA4l3E5", "name": "Eddie",         "stability": 0.0},
}

# (phrase, tag): the tag is spoken-copy only, inserted before the first place the phrase occurs.
TAGS = {
    "briefing": [("I'm Dolores", "[warmly]"), ("And what is this place called", "[curious]"),
                 ("A cultural landscape is", "[thoughtfully]")],
    "mercado": [("Buenos", "[warmly]"), ("When my family came", "[softly]"),
                ("Ay, perd", "[laughs nervously]"), ("I will not make you rich", "[sincerely]")],
    "brewery": [("Sorry. It's a problem", "[laughs]"), ("I say \"authentic\" a lot", "[sheepish]"),
                ("The worry", "[nervous]"), ("Probably fine", "[unsure]")],
    "landing": [("Maggie Alvarez", "[confident]"), ("Yes, I'm targeting", "[dry]"),
                ("Twenty-six minutes", "[firmly]"), ("Don't workshop it", "[deadpan]")],
    "residences": [("Brent Hollis", "[smooth]"), ("It had a vibe", "[smug]"),
                   ("Authentic luxury", "[proudly]"), ("It's a good flyer", "[smug]"),
                   ("Bold. Disruptive", "[excited]")],
    "littleprague": [("Na zdrav", "[cheerfully]"), ("Is that Czech?", "[pause]"),
                     ("I did the math. I think", "[unsure]"), ("Everybody loves a theme", "[laughs]")],
}

SAY = {
    "1982,": "nineteen eighty-two,", "1893": "eighteen ninety-three", "1971,": "nineteen seventy-one,",
    "1976.": "nineteen seventy-six.", "1950,": "nineteen fifty,", "2000,": "two thousand,",
    "1994.": "nineteen ninety-four.", "2019.": "twenty nineteen.", "2015,": "twenty fifteen,",
    "1921": "nineteen twenty-one", "zdrav\u00ed.": "zdrah-vee.", "zdrav\u00ed!": "zdrah-vee!",
    "An\u011b\u017eka": "Ah-nyezh-kah", "E-Gate.": "E-Gate.",
}


def spoken_word(w):
    return SAY.get(w, w)


def build(pid, paras):
    text = "\n\n".join(" ".join(spoken_word(w) for w in p.split()) for p in paras)
    for phrase, tag in TAGS.get(pid, []):
        i = text.find(phrase)
        if i >= 0:
            text = text[:i] + tag + " " + text[i:]
    return text


def spoken_words(alignment):
    """Words as voiced, with times, skipping [tags]."""
    out, cur, start, end, depth = [], "", None, 0, 0
    for c, s, e in zip(alignment["characters"], alignment["character_start_times_seconds"],
                       alignment["character_end_times_seconds"]):
        if c == "[":
            depth += 1
            continue
        if c == "]":
            depth = max(0, depth - 1)
            continue
        if depth:
            continue
        if c.isspace():
            if cur:
                out.append((cur, start, end))
            cur, start = "", None
        else:
            if start is None:
                start = s
            cur += c
            end = e
    if cur:
        out.append((cur, start, end))
    return out


def loudnorm(mp3_bytes):
    return subprocess.run([FFMPEG, "-v", "error", "-f", "mp3", "-i", "-", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                           "-ar", "44100", "-b:a", "128k", "-f", "mp3", "-"],
                          input=mp3_bytes, capture_output=True, check=True).stdout


def voice(pid, cut, scripts):
    paras = scripts[pid]["scripts"][cut]
    v = VOICES[pid]
    eleven.ensure_voice(v["id"], v["name"])
    r = eleven.tts(v["id"], build(pid, paras), settings={"stability": v["stability"], "similarity_boost": 0.8})
    sw = spoken_words(r["alignment"])
    words, j = [], 0
    for pi, p in enumerate(paras):
        for w in p.split():
            n = len(spoken_word(w).split())
            grp = sw[j:j + n]
            j += n
            if not grp:
                sys.exit(f"{pid} {cut}: ran out of voiced words at {w!r}")
            words.append({"w": w, "s": round(grp[0][1], 3), "e": round(grp[-1][2], 3), "p": pi})
    if j != len(sw):
        print(f"  warning: {len(sw) - j} voiced words left over", file=sys.stderr)
    os.makedirs(OUT, exist_ok=True)
    base = os.path.join(OUT, f"{pid}-{cut}")
    open(base + ".mp3", "wb").write(loudnorm(eleven.mp3(r)))
    json.dump({"voice": v["name"], "duration": words[-1]["e"], "words": words},
              open(base + ".words.json", "w"), separators=(",", ":"))
    print(f"{pid}-{cut}: {words[-1]['e']:.1f}s, {len(words)} words")


def main():
    scripts = json.load(open(os.path.join(ROOT, "content", "scripts.json")))
    pids = [sys.argv[1]] if len(sys.argv) > 1 else list(VOICES)
    cuts = ["short"]
    for pid in pids:
        for cut in cuts:
            voice(pid, cut, scripts)


if __name__ == "__main__":
    main()
