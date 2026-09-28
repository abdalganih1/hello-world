# Generates audio/<scene>.mp3 narration with a Syrian Arabic neural voice (edge-tts).
import asyncio, json, os, ssl, sys
import edge_tts, edge_tts.communicate as comm

VOICE = "ar-SY-LaithNeural"
here = os.path.dirname(os.path.abspath(__file__))

# Behind a TLS-inspecting proxy edge-tts must trust the proxy CA and go through HTTPS_PROXY.
ca = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt" if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
if ca:
    comm._SSL_CTX = ssl.create_default_context(cafile=ca)
proxy = os.environ.get("HTTPS_PROXY")

async def main():
    scenes = json.load(open(os.path.join(here, "narration.json"), encoding="utf-8"))
    os.makedirs(os.path.join(here, "audio"), exist_ok=True)
    for s in scenes:
        out = os.path.join(here, "audio", s["id"] + ".mp3")
        await edge_tts.Communicate(" ".join(s["text"]), VOICE, rate="-4%", proxy=proxy).save(out)
        print("wrote", out)

asyncio.run(main())
