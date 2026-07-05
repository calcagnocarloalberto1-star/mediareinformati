# estrattore resumibile: elabora finché restano <35s
import json, os, sys, time, subprocess, re
T0 = time.time()
BASE = "/sessions/sharp-gracious-heisenberg/mnt/materiale di lavoro/"
OUT = "/tmp/diritto/txt"
t = open("/sessions/sharp-gracious-heisenberg/mnt/Desktop/mediareinformati/data/normativa.js", encoding="utf-8").read()
arr = json.loads(t[t.index("["):t.rindex("]")+1])
italiane = [x for x in arr if x.get("ambito") == "Italia"]
fatti = 0; saltati = 0
for i, x in enumerate(italiane):
    if time.time() - T0 > 33: break
    dest = os.path.join(OUT, "%04d.txt" % i)
    if os.path.exists(dest): continue
    src = BASE + x["percorso"]
    ext = os.path.splitext(src)[1].lower()
    try:
        if ext == ".pdf":
            subprocess.run(["pdftotext", "-l", "12", src, dest], timeout=20, capture_output=True)
        else:
            subprocess.run(["soffice", "--headless", "--convert-to", "txt:Text", "--outdir", "/tmp/diritto/conv", src],
                           timeout=25, capture_output=True)
            nome = os.path.splitext(os.path.basename(src))[0] + ".txt"
            conv = "/tmp/diritto/conv/" + nome
            if os.path.exists(conv): os.replace(conv, dest)
            else: open(dest, "w").write("")
        fatti += 1
    except Exception:
        open(dest, "w").write(""); saltati += 1
pronti = len([f for f in os.listdir(OUT)])
print("elaborati ora:", fatti, "| saltati:", saltati, "| totale pronti:", pronti, "/", len(italiane))
