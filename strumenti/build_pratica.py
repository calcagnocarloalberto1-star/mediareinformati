# -*- coding: utf-8 -*-
"""Genera data/pratica.js e data/corpus_pratica.js dalle opere della Pratica.
Opere edite/riservate: sul sito solo estratti; testo integrale nel corpus compresso,
usato esclusivamente per comporre i contributi."""
import re, json, os, zlib, base64

TXT = "/tmp/pratica/txt"
OUT = "/tmp/pratica/out"
os.makedirs(OUT, exist_ok=True)

OPERE = [
 ("dispensa_cnma_2026.txt", "Dispensa del corso base per mediatori CNMA (2026)", "Dispensa"),
 ("dispensa_unam_2025.txt", "Dispensa U.N.A.M. 2024-2025", "Dispensa"),
 ("prontuario_trasversali.txt", "Piccolo prontuario delle discipline trasversali", "Prontuario"),
 ("leggere_la_persona.txt", "Leggere la persona, accompagnare il conflitto", "Manuale"),
]

TEMI = [
 (r"primo incontro|programmaz|incontro di mediazione", "Primo incontro"),
 (r"ascolto attivo|parafras|riformulaz|rispecchiament|ricalco", "Ascolto e riformulazione"),
 (r"domand[ae]|circolar|maieutic", "Le domande del mediatore"),
 (r"caucus|sessioni separate|riservat|navetta", "Sessioni e riservatezza"),
 (r"verbal|accordo di conciliaz|esecutiv", "Verbale e accordo"),
 (r"negoziaz|harvard|batna|maan|zopa|ancoragg", "Negoziazione"),
 (r"conflitt|escalation|glasl", "Teoria del conflitto"),
 (r"emozion|empatia|rabbia|paura", "Emozioni"),
 (r"comunicaz|non verbale|vak|prossemic|paraverbal", "Comunicazione"),
 (r"enneagramma|archetip|personalit|leggere la persona", "Tipologie di persona"),
 (r"28/2010|150/23|cartabia|procedibilit|normativ|decreto", "Cornice normativa"),
 (r"deontolog|imparzial|neutralit|indipendenz|obbligh", "Deontologia"),
 (r"organism|registro|formazion|tirocin", "Organismi e formazione"),
 (r"telematic|videoconferenz|firma digitale", "Mediazione telematica"),
 (r"condomin|banc|sanitar|famil|societar|successor", "Le materie"),
 (r"stori|antropolog|neolitic|cina|india|grec|roman", "Radici storiche e culturali"),
]
def temi_di(testo):
    t = testo.lower(); found = []
    for rx, tema in TEMI:
        n = len(re.findall(rx, t))
        if n >= 2: found.append((n, tema))
    found.sort(reverse=True)
    return [x[1] for x in found[:2]] or ["Pratica generale"]

def pulisci(s):
    s = re.sub(r"﻿", "", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

RX_NUM = re.compile(r"^\s*(\d{1,2}(?:\.\d{1,2})?)\.?\s+([A-ZÀ-Ù][^\n]{6,90})\s*$")
RX_MAI = re.compile(r"^\s*([A-ZÀ-Ù][A-ZÀ-Ù0-9 ,.'’\-()/:]{8,85})\s*$")
RX_CAP = re.compile(r"^\s*(Capitolo\s+[IVXLC\d]+[^\n]{0,70}|CAPITOLO\s+[IVXLC\d]+[^\n]{0,70}|PARTE \w+[^\n]{0,60}|Modulo \d+[^\n]{0,60})\s*$")

def segmenta(testo):
    righe = testo.split("\n")
    out = []; cap = ""; tit = ""; buf = []
    def chiudi():
        blocco = pulisci("\n".join(buf))
        if len(blocco) >= 250: out.append([cap, tit, blocco])
    for r in righe:
        s = r.strip()
        mc = RX_CAP.match(s); mn = RX_NUM.match(s); mm = RX_MAI.match(s) if not mn else None
        if mc:
            chiudi(); buf = []; cap = s[:80]; tit = ""
        elif (mn or mm) and len(pulisci("\n".join(buf))) >= 600:
            chiudi(); buf = []
            cand = (mn.group(1) + ". " + mn.group(2)) if mn else mm.group(1).title()
            tit = "" if cand.rstrip().endswith((":", "—", "-")) else cand.strip().rstrip(";")
        elif (mn or mm) and not tit and not buf:
            cand = (mn.group(1) + ". " + mn.group(2)) if mn else mm.group(1).title()
            tit = cand.strip().rstrip(";")
        else:
            buf.append(r)
    chiudi()
    return out

def spezza(blocco, maxlen=6500):
    if len(blocco) <= maxlen: return [blocco]
    parti = []; corr = ""
    for p in blocco.split("\n\n"):
        if len(corr) + len(p) > maxlen and corr:
            parti.append(corr); corr = p
        else:
            corr = (corr + "\n\n" + p) if corr else p
    if corr: parti.append(corr)
    return parti

voci = []; corpus = []; nid = 0; visti = set()
for fname, opera, tipo in OPERE:
    testo = pulisci(open(os.path.join(TXT, fname), encoding="utf-8", errors="replace").read())
    sezioni = segmenta(testo) or [["", "", testo]]
    for cap, tit, blocco in sezioni:
        for k, parte in enumerate(spezza(blocco)):
            piatto = re.sub(r"\s+", " ", parte)
            chiave = re.sub(r"[^a-zà-ù0-9]", "", piatto.lower())[:180]
            if chiave in visti: continue   # dedup tra dispense sovrapposte
            visti.add(chiave)
            nid += 1
            vid = "PR-%04d" % nid
            titolo = tit or (cap if cap else opera)
            if k: titolo += " (segue %d)" % (k + 1)
            voci.append({
                "id": vid, "opera": opera, "tipo": tipo, "capitolo": cap,
                "titolo": titolo, "temi": temi_di(parte), "estratto": piatto[:600],
            })
            corpus.append({"id": vid, "testo": piatto})

with open(os.path.join(OUT, "pratica.js"), "w", encoding="utf-8") as f:
    f.write("window.DATA_PRATICA_SEZ = ")
    json.dump(voci, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
blob = base64.b64encode(zlib.compress(json.dumps(corpus, ensure_ascii=False).encode("utf-8"), 9)).decode("ascii")
with open(os.path.join(OUT, "corpus_pratica.js"), "w", encoding="utf-8") as f:
    f.write("/* Archivio di lavoro dell'assistente: contenuto compresso, non destinato alla lettura diretta. */\n")
    f.write('window.DATA_CORPUS_PRATICA_C = "' + blob + '";\n')
print("voci:", len(voci))
from collections import Counter
print(Counter(v["opera"][:40] for v in voci))
print("pratica.js:", os.path.getsize(OUT + "/pratica.js"), "corpus:", os.path.getsize(OUT + "/corpus_pratica.js"))
