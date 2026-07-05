# -*- coding: utf-8 -*-
"""Genera data/corpus_diritto.js: testo (max 4500 char) per ogni atto italiano di normativa.js."""
import json, os, re, zlib, base64
t = open("/sessions/sharp-gracious-heisenberg/mnt/Desktop/mediareinformati/data/normativa.js", encoding="utf-8").read()
arr = json.loads(t[t.index("["):t.rindex("]")+1])
italiane = [x for x in arr if x.get("ambito") == "Italia"]
corpus = []; vuoti = 0
for i, x in enumerate(italiane):
    p = "/tmp/diritto/txt/%04d.txt" % i
    try:
        testo = open(p, encoding="utf-8", errors="replace").read()
    except FileNotFoundError:
        testo = ""
    testo = re.sub(r"\s+", " ", testo).strip()
    if len(testo) < 120: vuoti += 1; continue
    # chiave: percorso (stabile) -> id posizionale nel file normativa
    corpus.append({"k": x["percorso"], "testo": testo[:4500]})
blob = base64.b64encode(zlib.compress(json.dumps(corpus, ensure_ascii=False).encode("utf-8"), 9)).decode("ascii")
out = "/sessions/sharp-gracious-heisenberg/mnt/Desktop/mediareinformati/data/corpus_diritto.js"
with open(out, "w", encoding="utf-8") as f:
    f.write("/* Archivio di lavoro dell'assistente: contenuto compresso, non destinato alla lettura diretta. */\n")
    f.write('window.DATA_CORPUS_DIRITTO_C = "' + blob + '";\n')
print("atti con testo:", len(corpus), "| senza testo utile (scansioni):", vuoti, "| dim:", os.path.getsize(out))
