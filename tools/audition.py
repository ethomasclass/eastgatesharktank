"""Voice auditions: one short line per candidate voice, written to auditions/ with a page to
listen to them side by side, plus rough measurements (speaking rate, pitch) to compare.

  python3 tools/audition.py            # voices every candidate in CANDIDATES (cached after the first run)
"""
import json, os, subprocess, sys
import numpy as np
import eleven

ROOT = os.path.join(eleven.HERE, "..")
OUT = os.path.join(ROOT, "auditions")
try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG = "ffmpeg"

LINES = {
    "turnpike": "Now I'll be straight with you. Roads cost more than anyone says. And I don't trust anything folks fight over.",
    "slater": "[whispers] Come closer. Closer. I shouldn't say this in a room this size. He carried no plans... he memorized them.",
    "steamboat": "[excited] Step right up, step right up! Have you heard about the boat that needs no wind? No oars? No mules?",
    "erie": "Gentlemen! Ladies! Look at this map. The price of shipping a ton? Not one hundred dollars. Ten. Ten dollars, gentlemen!",
    "northerncross": "Friends! Neighbors! Sit down, sit down. A gentleman in Springfield bought early. Wouldn't tell me his name. Modest fellow.",
}

CANDIDATES = {
    "turnpike": {"TTyZrDYo6LQowrH8mixJ": "Joseph Ortman (deep, raspy, calm)",
                 "qAZH0aMXY8tw1QufPN0D": "Flint (old, deep, raspy)",
                 "fbIG6gEosVIM95R5qOna": "Clint (old, raspy, experienced)"},
    "slater": {"KwPhPlUeXKi2eSe2IWCY": "Nathaniel C (British, whispery, suspenseful)",
               "agL69Vji082CshT65Tcy": "Lance Blackwood (posh British, dry, sly)",
               "JZpc1bnONUh6seOuLjQe": "Whispering Joe (British RP, hushed)"},
    "steamboat": {"dHd5gvgSOzSfduK4CvEg": "Ed (over-the-top announcer)",
                  "QMJTqaMXmGnG8TCm8WQG": "Clyde (vintage radio announcer)",
                  "TtRFBnwQdH1k01vR0hMz": "Arthur (young, energetic)"},
    "erie": {"87tjwokZlpNU7QL3HaLP": "Reverend (resonant preacher)",
             "RPJ8nnVtuTgG8McXwW6M": "James Lindsay (booming businessman)",
             "1lIvFR85wn7Nid3Pu83U": "Edmund (theatrical, British)"},
    "northerncross": {"9T9vSqRrPPxIs5wpyZfK": "Eric (Southern, smooth, charming)",
                      "a4BsmeT8RITKlxlCY9PO": "Brother Wayne (old-timey Southern)",
                      "4m3xt3xfssayzO1e9shv": "Mr. Pete (warm Southern dad)"},
}


def measure(mp3_bytes, alignment):
    pcm = subprocess.run([FFMPEG, "-v", "error", "-f", "mp3", "-i", "-", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         input=mp3_bytes, capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, np.int16).astype(float) / 32768
    win, pitches = 640, []
    for i in range(0, len(a) - win, win // 2):
        x = a[i:i + win]
        if np.sqrt((x ** 2).mean()) < 0.03:
            continue
        c = np.correlate(x, x, "full")[win - 1:]
        lo, hi = 16000 // 400, 16000 // 60          # 60-400 Hz
        k = lo + int(np.argmax(c[lo:hi]))
        if c[k] > 0.35 * c[0]:
            pitches.append(16000 / k)
    words = len([w for w in "".join(alignment["characters"]).split() if not w.startswith("[")])
    dur = alignment["character_end_times_seconds"][-1]
    return {"seconds": round(dur, 2), "words_per_sec": round(words / dur, 2),
            "pitch_hz": round(float(np.median(pitches)), 1) if pitches else None,
            "pitch_spread": round(float(np.std(pitches)), 1) if pitches else None}


def main():
    os.makedirs(OUT, exist_ok=True)
    report = {}
    for pid, cands in CANDIDATES.items():
        for vid, label in cands.items():
            r = eleven.tts(vid, LINES[pid])
            name = f"{pid}-{vid}.mp3"
            data = eleven.mp3(r)
            open(os.path.join(OUT, name), "wb").write(data)
            m = measure(data, r["alignment"])
            report.setdefault(pid, []).append({"voice_id": vid, "label": label, "file": name, **m})
            print(pid, label, m)
    json.dump({"lines": LINES, "voices": report}, open(os.path.join(OUT, "auditions.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
