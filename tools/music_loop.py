"""Makes the background theme loop seamlessly: assets/audio/source/<track>.mp3 -> assets/audio/theme.mp3.

The track's last few seconds are crossfaded into its first few, so when the player jumps from the
end back to the start the music simply continues. Loudness is set to -16 LUFS (the voices' level);
the site then plays it quietly underneath them.

  python3 tools/music_loop.py "assets/audio/source/soft-bowed-strings.mp3"
"""
import os, subprocess, sys
import numpy as np
try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG = "ffmpeg"

RATE, FADE = 44100, 2.5
src = sys.argv[1]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "audio", "theme.mp3")
pcm = subprocess.run([FFMPEG, "-v", "error", "-i", src, "-map", "0:a", "-f", "f32le", "-ac", "2", "-ar", str(RATE), "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.float32).reshape(-1, 2).copy()
loud = np.nonzero(np.abs(x).max(1) > 1e-3)[0]
x = x[loud[0]:loud[-1] + 1]                       # trim silence at both ends
d = int(FADE * RATE)
t = np.linspace(0, np.pi / 2, d)[:, None]
y = x[d:].copy()
y[-d:] = x[-d:] * np.cos(t) + x[:d] * np.sin(t)   # equal-power crossfade: tail -> head
raw = y.astype(np.float32).tobytes()
subprocess.run([FFMPEG, "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(RATE), "-i", "-",
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(RATE), "-b:a", "160k", out], input=raw, check=True)
print(f"wrote {out}: {len(y) / RATE:.1f}s loop")
