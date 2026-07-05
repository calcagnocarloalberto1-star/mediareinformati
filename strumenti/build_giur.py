# -*- coding: utf-8 -*-
"""corpus_giur.js: testo (max 3500 char, parte centrale-motivazionale) per provvedimento."""
import json, os, re, zlib, base64
t = open("/sessions/sharp-gracious-heisenberg/mnt/Desktop/mediareinformati/data/giurisprudenza.js", encoding="utf-8").read()
arr = json.loads(t[t.index("["):t.rindex("]")+1])
corpus = []; vuoti = 0
for i, x in enumerate(arr):
    p = "/tmp/giur/txt/%04d.txt" % i
    try: testo = open(p, encoding="utf-8", errors="replace").read()
    except FileNotFoundError: testo = ""
    testo = re.sub(r"\s+", " ", testo).strip()
    if len(testo) < 120: vuoti += 1; continue
    # privilegia la parte con "ritenuto/considerato/motivi/p.q.m." se lunga
    m = re.search(r"(motivi della decisione|ragioni della decisione|considerato in diritto|osserva)", testo, re.I)
    if m and len(testo) - m.start() > 800:
        estratto = testo[m.start():m.start() + 3500]
    else:
        estratto = testo[:3500]
    corpus.append({"k": x["percorso"], "testo": estratto})
blob = base64.b64encode(zlib.compress(json.dumps(corpus, ensure_ascii=False).encode("utf-8"), 9)).decode("ascii")
out = "/sessions/sharp-gracious-heisenberg/mnt/Desktop/mediareinformati/data/corpus_giur.js"
with open(out, "w", encoding="utf-8") as f:
    f.write("/* Archivio di lavoro dell'assistente: contenuto compresso, non destinato alla lettura diretta. */\n")
    f.write('window.DATA_CORPUS_GIUR_C = "' + blob + '";\n')
print("con testo:", len(corpus), "| scansioni senza testo:", vuoti, "| dim:", os.path.getsize(out))
