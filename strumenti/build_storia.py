# -*- coding: utf-8 -*-
"""Genera data/storia.js e data/corpus_storia.js dalla cartella 'Storia della mediazione'.
Regola editoriale: le opere edite NON sono pubblicate in versione integrale;
ogni sezione espone solo un estratto limitato."""
import re, json, os, sys, zlib, base64

TXT = "/tmp/storia/txt"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/storia/out"
os.makedirs(OUT, exist_ok=True)

OPERE = [
 ("sistemi di composizione delle controversie - volume 1.txt",
  "Sistemi di composizione delle controversie — Vol. I (Arbitrato e conciliazione)", "Volume", "Opera edita"),
 ("sistemi di composizione delle controversie (volume 2) (1).txt",
  "Sistemi di composizione delle controversie — Vol. II", "Volume", "Opera edita"),
 ("sistemi di composizione delle controversie (volume 3) (1).txt",
  "Sistemi di composizione delle controversie — Vol. III", "Volume", "Opera edita"),
 ("sistemi di composizione delle controversie (volume 4).txt",
  "Sistemi di composizione delle controversie — Vol. IV", "Volume", "Opera edita"),
 ("sistemi di composizione delle controversie (volume 5).txt",
  "Sistemi di composizione delle controversie — Vol. V", "Volume", "Opera edita"),
 ("breve storia della risoluzione del conflitto.txt",
  "Breve storia della risoluzione del conflitto", "Saggio", "Opera edita"),
 ("I nemici della conciliazione testo 2019 (2).txt",
  "Amici e nemici della conciliazione (2019)", "Saggio", "Testo d'archivio"),
 ("Il legale e la mediazione.txt",
  "Il legale e la mediazione (2014)", "Saggio", "Opera edita"),
 ("manuale del geometra mediatore finale.txt",
  "Manuale del geometra mediatore", "Manuale", "Opera edita"),
 ("manuale_miti_enneagramma_mediazione (Ripristinato).txt",
  "Miti, Enneagramma, metodo di Harvard e mediazione interiore", "Manuale", "Testo d'archivio"),
 ("dei e mediazione.txt", "Le divinità: funzioni archetipiche", "Studio", "Testo d'archivio"),
 ("dei mesopotamici.txt", "Divinità mesopotamiche e principi di Harvard", "Studio", "Testo d'archivio"),
 ("Manuale_CNMA-CMNA.txt", "Manuale CNMA-CMNA (corso per mediatori, d.m. 150/2023)", "Manuale", "Testo d'archivio"),
]

TEMI = [
 (r"mesopotam|sumer|accad|babilon|inanna|ishtar|hammurabi|enki|ereshkigal", "Mesopotamia e miti"),
 (r"\bgrec|omero|atene|ateni|ellen|solone|dracone|locres", "Grecia antica"),
 (r"\broma\b|romani|romano|digesto|giustinian|pretor|cicerone|xii tavole", "Roma antica"),
 (r"bibbia|vangel|talmud|ebraic|canonic|ecclesiast|vescov", "Tradizione religiosa"),
 (r"medioev|comunal|statuti|feudal|longobard", "Medioevo"),
 (r"ottocent|1[78]\d\d|napoleon|regno di sardegna|regno delle due sicilie|granducato|stato pontificio|foramiti|conciliatore", "Età moderna e Ottocento"),
 (r"novecent|19\d\d|fascis|codice del 1940|d\.lgs|28/2010|cartabia|unione europea|direttiva", "Novecento e oggi"),
 (r"\bcina\b|cinese|giappon|malesia|vietnam|yemen|india|shuohe|orient", "Mondo orientale"),
 (r"kosovo|russia|stati uniti|common law|inghilterra|francia|spagna", "Sistemi stranieri"),
 (r"arbitr", "Arbitrato"),
 (r"avvocat|deontolog|forense|legale", "Avvocatura"),
 (r"enneagramma|archetip|harvard|counseling|trasformativ", "Metodi e archetipi"),
 (r"geometra|tecnic|perizia|condomin", "Professioni tecniche"),
]

def temi_di(testo):
    t = testo.lower(); found = []
    for rx, tema in TEMI:
        n = len(re.findall(rx, t))
        if n >= 2: found.append((n, tema))
    found.sort(reverse=True)
    return [x[1] for x in found[:2]]

def pulisci(s):
    s = re.sub(r"﻿", "", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

RX_CAP = re.compile(r"^\s*(Capitolo\s+[IVXLC\d]+|CAPITOLO\s+[IVXLC\d]+)\s*$", re.M)
RX_SEZ = re.compile(r"^\s*(\d{1,2}(?:\.\d{1,2})?)\.?\s+([A-ZÀ-Ù][^\n]{8,95})\s*$")


STOP_IT = set("il lo la i gli le un una di a da in con su per tra fra che chi cui non più anche come dove quando se della delle dello degli del dei nel nella alle alla agli ed è sono era erano essere avere ha hanno questo questa questi queste quello quella al dal sul col ai".split())
def italiano(testo):
    parole = re.findall(r"[a-zàèéìòù']+", testo.lower())
    if len(parole) < 30: return True
    n = sum(1 for p in parole if p in STOP_IT)
    return n / len(parole) >= 0.12

RX_LEGGE = re.compile(r"^\s*([A-ZÀ-Ü][A-ZÀ-Ü \.']{2,40})\.\s*(\d{1,3})\.\s*([^\n]{10,180})$", re.M)
def segmenta_vol5(testo):
    out = []
    matches = list(RX_LEGGE.finditer(testo))
    for k, m in enumerate(matches):
        fine = matches[k+1].start() if k+1 < len(matches) else len(testo)
        paese = m.group(1).title().strip()
        tit = m.group(3).strip().rstrip(";")
        blocco = testo[m.end():fine]
        if len(blocco) < 150: blocco = tit + "\n" + blocco
        out.append(["Raccolta per paese: " + paese, paese + " — " + tit, pulisci(blocco)])
    return out


def segmenta_indice(testo, solo_storia=True):
    """Segmenta un documento con indice iniziale (titolo<TAB>pagina)."""
    righe = testo.split("\n")
    toc = []; ultimo = 0
    for i, r in enumerate(righe[:900]):
        m = re.match(r"^([^\t]{4,120})\t\d{1,4}\s*$", r.strip())
        if m: toc.append(m.group(1).strip()); ultimo = i
    if len(toc) < 5: return []
    corpo = "\n".join(righe[ultimo+1:])
    pos = []
    cursore = 0
    for tit in toc:
        idx = corpo.find("\n" + tit, cursore)
        if idx == -1: idx = corpo.find(tit, cursore)
        if idx != -1:
            pos.append((idx, tit)); cursore = idx + len(tit)
    out = []
    for k, (idx, tit) in enumerate(pos):
        fine = pos[k+1][0] if k+1 < len(pos) else len(corpo)
        blocco = pulisci(corpo[idx+len(tit):fine])
        if len(blocco) >= 200: out.append(["", tit, blocco])
    if solo_storia:
        # parte storica: sezioni prima di "SOCIOLOGIA DEL CONFLITTO" + sezioni a tema storico
        RX_ST = re.compile(r"stori|origin|antic|sumer|egiz|grec|roman|barbar|federico|lumi|costituzion|conciliat|prussia|danese|lombardo|sicilie|portoghese|1865|1790|filosof|matrilineare|divinit|giustizia in|giustizia presso|giustizia nel|giustizia dalle|nascita della mediazione", re.I)
        taglio = len(out)
        for k, s in enumerate(out):
            if "SOCIOLOGIA DEL CONFLITTO" in s[1].upper(): taglio = k; break
        out = [s for k, s in enumerate(out) if k < taglio or RX_ST.search(s[1])]
    return out

def segmenta(testo):
    """Restituisce lista (capitolo, titolo_sezione, testo). Un candidato-titolo è
    confermato solo se raccoglie almeno 600 caratteri prima del successivo."""
    righe = testo.split("\n")
    out = []; cap = ""; tit = ""; buf = []
    def chiudi():
        blocco = pulisci("\n".join(buf))
        if len(blocco) >= 200:
            out.append([cap, tit, blocco])
    i = 0
    while i < len(righe):
        r = righe[i]
        if RX_CAP.match(r):
            chiudi(); buf = []
            cap = r.strip()
            # riga successiva breve senza punto finale = titolo del capitolo
            j = i + 1
            while j < len(righe) and not righe[j].strip(): j += 1
            if j < len(righe) and 0 < len(righe[j].strip()) < 80 and not righe[j].strip().endswith("."):
                cap = cap + " — " + righe[j].strip(); i = j
            tit = ""
        else:
            m = RX_SEZ.match(r)
            if m and len(pulisci("\n".join(buf))) >= 600:
                chiudi(); buf = []
                cand = (m.group(1) + ". " + m.group(2)).strip().rstrip(";")
                tit = "" if cand.rstrip().endswith((":", "\u2014", "-")) else cand
            elif m and not tit and not buf:
                tit = (m.group(1) + ". " + m.group(2)).strip().rstrip(";")
            else:
                buf.append(r)
        i += 1
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

voci = []; corpus = []; nid = 0
for fname, opera, tipo, stato in OPERE:
    path = os.path.join(TXT, fname)
    grezzo = open(path, encoding="utf-8", errors="replace").read()
    testo = pulisci(grezzo)
    if "volume 5" in fname:
        sezioni = segmenta_vol5(testo)
    elif "CNMA" in fname:
        sezioni = segmenta_indice(grezzo)
    else:
        sezioni = segmenta(testo)
        sezioni = [s for s in sezioni if italiano(s[2])]
    if not sezioni:
        sezioni = [["", "", testo]]
    for cap, tit, blocco in sezioni:
        for k, parte in enumerate(spezza(blocco)):
            nid += 1
            vid = "ST-%04d" % nid
            titolo = tit or (cap if cap else opera)
            if k: titolo += " (segue %d)" % (k + 1)
            estr = re.sub(r"\s+", " ", parte)[:600]
            voci.append({
                "id": vid, "opera": opera, "tipo": tipo, "stato": stato,
                "capitolo": cap, "titolo": titolo,
                "temi": temi_di(parte) or ["Storia generale"],
                "estratto": estr,
            })
            corpus.append({"id": vid, "testo": re.sub(r"\s+", " ", parte)})

def dump(nome, var, dati):
    with open(os.path.join(OUT, nome), "w", encoding="utf-8") as f:
        f.write("window.%s = " % var)
        json.dump(dati, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

dump("storia.js", "DATA_STORIA", voci)
# corpus protetto: testo integrale usato SOLO per comporre i contributi dell'assistente,
# serializzato compresso e codificato per non essere leggibile ne' indicizzabile
blob = base64.b64encode(zlib.compress(json.dumps(corpus, ensure_ascii=False).encode("utf-8"), 9)).decode("ascii")
with open(os.path.join(OUT, "corpus_storia.js"), "w", encoding="utf-8") as f:
    f.write("/* Archivio di lavoro dell'assistente: contenuto compresso, non destinato alla lettura diretta. */\n")
    f.write("window.DATA_CORPUS_STORIA_C = \"" + blob + "\";\n")
print("voci:", len(voci), "| opere:", len(OPERE))
from collections import Counter
print(Counter(v["opera"].split(" — ")[0] for v in voci))
print("dim storia.js:", os.path.getsize(os.path.join(OUT,"storia.js")),
      "corpus:", os.path.getsize(os.path.join(OUT,"corpus_storia.js")))
