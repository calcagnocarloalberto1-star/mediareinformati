# -*- coding: utf-8 -*-
"""Genera data/corpus_diritto.js: per ogni atto italiano di data/normativa.js
estrae il testo (max 4500 char) dai file .txt scaricati e lo comprime.

Uso:
  python strumenti/build_diritto.py [--txt CARTELLA_TXT] [--repo RADICE_REPO]

Percorsi predefiniti (relativi alla radice del repository, calcolata dalla
posizione di questo script):
  --repo  radice del repository            (default: cartella superiore a strumenti/)
  --txt   cartella dei .txt per atto       (default: <repo>/tmp/diritto/txt)

I .txt sono attesi come 0000.txt, 0001.txt, ... nell'ordine posizionale degli
atti con ambito "Italia" dentro data/normativa.js.
"""
import argparse, json, os, re, zlib, base64

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DEFAULT = os.path.dirname(SCRIPT_DIR)

parser = argparse.ArgumentParser(description="Genera data/corpus_diritto.js")
parser.add_argument("--repo", default=REPO_DEFAULT,
                    help="radice del repository (default: cartella superiore allo script)")
parser.add_argument("--txt", default=None,
                    help="cartella dei .txt per atto (default: <repo>/tmp/diritto/txt)")
args = parser.parse_args()

repo = os.path.abspath(args.repo)
txt_dir = os.path.abspath(args.txt) if args.txt else os.path.join(repo, "tmp", "diritto", "txt")
normativa = os.path.join(repo, "data", "normativa.js")
out = os.path.join(repo, "data", "corpus_diritto.js")

t = open(normativa, encoding="utf-8").read()
arr = json.loads(t[t.index("["):t.rindex("]")+1])
italiane = [x for x in arr if x.get("ambito") == "Italia"]
corpus = []; vuoti = 0
for i, x in enumerate(italiane):
    p = os.path.join(txt_dir, "%04d.txt" % i)
    try:
        testo = open(p, encoding="utf-8", errors="replace").read()
    except FileNotFoundError:
        testo = ""
    testo = re.sub(r"\s+", " ", testo).strip()
    if len(testo) < 120: vuoti += 1; continue
    # chiave: percorso (stabile) -> id posizionale nel file normativa
    corpus.append({"k": x["percorso"], "testo": testo[:4500]})
blob = base64.b64encode(zlib.compress(json.dumps(corpus, ensure_ascii=False).encode("utf-8"), 9)).decode("ascii")
with open(out, "w", encoding="utf-8") as f:
    f.write("/* Archivio di lavoro dell'assistente: contenuto compresso, non destinato alla lettura diretta. */\n")
    f.write('window.DATA_CORPUS_DIRITTO_C = "' + blob + '";\n')
print("atti con testo:", len(corpus), "| senza testo utile (scansioni):", vuoti, "| dim:", os.path.getsize(out))
