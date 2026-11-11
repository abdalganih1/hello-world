"""Minimal vibi.pro client (stdlib only). vibi.pro wraps ElevenLabs; the call is asynchronous:
  POST /v1/text-to-speech/{voice_id}  -> 202 {"id": ...}
  GET  /v1/history/{id}               -> poll until status == "completed" (or "failed")
  GET  result.audio_url               -> download AT ONCE (links expire)
Traps: header is `xi-api-key` (not Bearer); Cloudflare blocks Python's default User-Agent (403 / 1010), so send a browser UA;
voice_id goes in the URL; language_code "ar"; body is UTF-8 JSON.
Key: env VIBI_API_KEY, else the first line of ~/.vibi_key, else <skill>/vibi_key.txt (never commit it).
CLI: python3 vibi_tts.py "نَصّ مُشَكَّل" out.mp3      |  python3 vibi_tts.py --balance"""
import json, os, sys, time, urllib.request
BASE = "https://vibi.pro"
GEORGE = "JBFqnCBsd6RMkjVDRZzb"           # ElevenLabs premade "George": warm, captivating storyteller (male)
MODEL = "eleven_v4"
SETTINGS = {"stability": 0.5, "similarity_boost": 0.75, "speed": 1.0}
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

def api_key():
    if os.environ.get("VIBI_API_KEY"): return os.environ["VIBI_API_KEY"].strip()
    for p in (os.path.expanduser("~/.vibi_key"), os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vibi_key.txt")):
        if os.path.exists(p): return open(p).read().strip().splitlines()[0]
    raise SystemExit("no vibi.pro key: set VIBI_API_KEY (or put it in ~/.vibi_key)")

def call(method, url, body=None, raw=False):
    req = urllib.request.Request(url, data=json.dumps(body, ensure_ascii=False).encode("utf-8") if body else None, method=method,
                                 headers={"xi-api-key": api_key(), "User-Agent": UA, "Content-Type": "application/json"})
    r = urllib.request.urlopen(req, timeout=180).read()
    return r if raw else json.loads(r)

def balance(): return int(call("GET", f"{BASE}/v1/auth/me")["credit_balance"])

def tts(text, out, voice=GEORGE, model=MODEL, settings=SETTINGS, retries=6):
    """Generate `text` and save the mp3 to `out`. Retries on network errors / failed tasks."""
    for k in range(retries):
        try:
            tid = call("POST", f"{BASE}/v1/text-to-speech/{voice}", {"text": text, "provider": "elevenlabs", "model_id": model,
                                                                     "language_code": "ar", "voice_settings": settings})["id"]
            for _ in range(150):
                h = call("GET", f"{BASE}/v1/history/{tid}")
                if h["status"] == "completed":
                    open(out, "wb").write(call("GET", h["result"]["audio_url"], raw=True)); return out
                if h["status"] == "failed": raise RuntimeError(h.get("error"))
                time.sleep(2)
            raise TimeoutError(tid)
        except Exception as e:
            print("  retry", k + 1, e, flush=True); time.sleep(3 * (k + 1))
    raise SystemExit("tts failed: " + text)

if __name__ == "__main__":
    if sys.argv[1:2] == ["--balance"]: print(balance())
    elif len(sys.argv) >= 3: print(tts(sys.argv[1], sys.argv[2]))
    else: print(__doc__)
