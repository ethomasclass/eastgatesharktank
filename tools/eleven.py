"""Small ElevenLabs client shared by the audio tools. Reads ELEVENLABS_API_KEY from tools/.env
(git ignores it) or the environment. Every text-to-speech response is cached in tools/cache/ by
request body, so re-running a tool on unchanged text spends no credits."""
import base64, hashlib, json, os, sys, urllib.error, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
API = "https://api.elevenlabs.io"


def key():
    p = os.path.join(HERE, ".env")
    if os.path.exists(p):
        for line in open(p):
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k, v)
    if not os.environ.get("ELEVENLABS_API_KEY"):
        sys.exit("Set ELEVENLABS_API_KEY in tools/.env or the environment.")
    return os.environ["ELEVENLABS_API_KEY"]


def call(path, body=None, method=None):
    req = urllib.request.Request(API + path, method=method or ("POST" if body is not None else "GET"),
                                 data=None if body is None else json.dumps(body).encode(),
                                 headers={"xi-api-key": key(), "Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=300).read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"ElevenLabs {e.code}: {e.read().decode()[:400]}")


def my_voice_ids():
    return {v["voice_id"] for v in call("/v2/voices?page_size=100")["voices"]}


def ensure_voice(voice_id, name=None):
    """Library (shared) voices must be added to the account before text-to-speech can use them."""
    if voice_id in my_voice_ids():
        return
    q = urllib.parse.urlencode({"voice_id": voice_id, "page_size": 1})
    hits = [v for v in call(f"/v1/shared-voices?{q}")["voices"] if v["voice_id"] == voice_id]
    if not hits and name:  # the voice_id filter is not always honored; fall back to a name search
        q = urllib.parse.urlencode({"search": name, "page_size": 100})
        hits = [v for v in call(f"/v1/shared-voices?{q}")["voices"] if v["voice_id"] == voice_id]
    if not hits:
        raise RuntimeError(f"voice {voice_id} not in your voices or the shared library")
    v = hits[0]
    call(f"/v1/voices/add/{v['public_owner_id']}/{voice_id}", {"new_name": name or v["name"]})


def tts(voice_id, text, model="eleven_v3", settings=None, prev=None, nxt=None):
    """Returns the API response: {audio_base64, alignment{characters, *_times_seconds}}."""
    body = {"text": text, "model_id": model,
            "voice_settings": settings or {"stability": 0.5, "similarity_boost": 0.8}}
    if not model.startswith("eleven_v3"):
        if prev: body["previous_text"] = prev
        if nxt: body["next_text"] = nxt
    h = hashlib.sha1(json.dumps([voice_id, body], sort_keys=True).encode()).hexdigest()[:16]
    cached = os.path.join(CACHE, h + ".json")
    if os.path.exists(cached):
        return json.load(open(cached))
    r = call(f"/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128", body)
    os.makedirs(CACHE, exist_ok=True)
    json.dump(r, open(cached, "w"))
    return r


def mp3(r):
    return base64.b64decode(r["audio_base64"])
