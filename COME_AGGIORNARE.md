# mediareinformati.it — Come aggiornare il sito

## Architettura in breve

Sito statico puro: HTML + CSS + JavaScript, nessuna dipendenza esterna, nessun server necessario.
Si apre facendo doppio clic su `index.html` e si pubblica copiando la cartella su qualunque hosting
(anche gratuito: GitHub Pages, Netlify, Cloudflare Pages) o via FTP.

```
mediareinformati/
├── index.html            home
├── storia.html           motore Storia
├── pratica.html          motore Pratica
├── diritto.html          motore Diritto (normativa)
├── sistemi.html          motore Sistemi nazionali (schede paese UE)
├── link.html             motore Link mondiali
├── statistiche.html      motore Dati e statistiche (serie WJP + fonti)
├── articoli.html         motore Articoli d'autore
├── giurisprudenza.html   motore Giurisprudenza
├── progetto.html         Progetto / Autore
├── assets/
│   ├── style.css         unico foglio di stile
│   └── app.js            motore di ricerca generico (ricerca + filtri + dettaglio)
├── data/                 UN file JS per motore = la "banca dati" del sito
│   ├── articoli.js         window.DATA_ARTICOLI
│   ├── giurisprudenza.js   window.DATA_GIURISPRUDENZA
│   ├── normativa.js        window.DATA_NORMATIVA
│   ├── sistemi.js          window.DATA_SISTEMI
│   ├── link.js             window.DATA_LINK
│   ├── statistiche.js      window.DATA_STATISTICHE
│   ├── statistiche_fonti.js window.DATA_STAT_FONTI
│   ├── pratica.js          window.DATA_PRATICA
│   └── storia.js           window.DATA_STORIA
└── strumenti/
    └── build_data.py     script che rigenera TUTTI i file di data/ dalla cartella
                          "materiale di lavoro" sul Desktop
```

I dati sono file `.js` (non `.json`) per una ragione precisa: così il sito funziona anche
aperto da disco (`file://`), senza server locale.

## Aggiornamento automatico (consigliato)

Quando aggiungi documenti a "materiale di lavoro" (o aggiorni gli indici CSV / il JSON degli
articoli), rigenera tutti i dati con:

```
python strumenti/build_data.py
```

Lo script richiede Python 3 con `openpyxl` (`pip install openpyxl`) e i percorsi indicati
in testa al file (variabili `SRC` e `OUT`): adattali se sposti le cartelle.

## Aggiornamento manuale di una singola voce

Ogni file in `data/` è un array JSON leggibile. Per aggiungere ad esempio una pronuncia,
apri `data/giurisprudenza.js` e aggiungi un oggetto:

```json
{"anno":"2026","organo":"Cassazione","categoria":"Mediazione",
 "titolo":"Cass. civ. sez. III, n. 1234/2026","file":"cass_1234_2026.pdf",
 "percorso":"giurisprudenza/2026/Mediazione/cass_1234_2026.pdf"}
```

I filtri delle pagine si costruiscono da soli sui valori presenti: non c'è nulla altro da toccare.

## Il massimario di lavoro (giurisprudenza)

`strumenti/massimario.xlsx` contiene le 174 pronunce pertinenti con colonne vuote:
**Estremi ufficiali, Materia, Esito, Massima, Sintesi, Verificato**.
Flusso di lavoro:

1. aprire il foglio, compilare le colonne per le pronunce esaminate (la colonna
   `Percorso` non va modificata: è la chiave di collegamento);
2. rilanciare `python strumenti/build_data.py`;
3. le massime compilate compaiono automaticamente nel motore Giurisprudenza
   (in elenco e nel dettaglio). Il foglio non viene mai sovrascritto dallo script.

## La classificazione dei link

`strumenti/link_meta.csv` (nome, paese, tipologia, lingua) arricchisce i collegamenti
della raccolta: è un overlay redazionale, modificabile con qualsiasi editor.
Nuovi link aggiunti all'xlsx di origine senza riga corrispondente nel CSV compaiono
comunque, semplicemente senza paese/tipologia/lingua.

## Il vaglio di pertinenza (giurisprudenza e normativa)

`strumenti/pertinenza.csv` decide che cosa entra nel sito: solo le righe con
`includi = SI` vengono pubblicate. L'esito automatico (colonna `esito_automatico`)
deriva dall'analisi del nome e del CONTENUTO dei documenti (termini: mediazione,
conciliazione, ADR, negoziazione assistita, d.lgs. 28/2010, ecc.).
Per correggere il vaglio: cambiare SI/NO nella colonna `includi` e rilanciare
`build_data.py`. Le voci "dubbio" (poche occorrenze) sono escluse per prudenza:
meritano revisione redazionale.

Gli articoli sono filtrati alla fonte: restano solo quelli pertinenti per titolo,
contenuto o categoria d'autore (ADR, Mediazione, ecc.).

## Le opere edite

Storia e Pratica pubblicano SOLO schede bibliografiche/descrittive: i testi
integrali (alcuni editi) non sono mai copiati nel sito. Non aggiungere percorsi
o testi completi delle opere edite ai file di data/.

## Le statistiche ministeriali (DGSTAT)

`data/dgstat.js` contiene le serie ufficiali del Ministero della Giustizia sulla
mediazione civile (iscrizioni 2011-2025, esiti 2014-2025, flussi per materia 2011-2023), trascritte
dalle Relazioni annuali DGSTAT (URL citati nel file e in pagina). Non e' generato da
build_data.py: si aggiorna a mano quando esce la nuova Relazione annuale
(datiestatistiche.giustizia.it > Rilevazioni > Mediazione civile), aggiungendo una
riga a `iscrizioni` e una a `esiti`. Le schede paese Scoreboard 2026 sono in `data/scoreboard_paesi.js`, estratte automaticamente dal Rapporto integrato in archivio.

## Report duplicati

`strumenti/REPORT_DUPLICATI.md` elenca i probabili duplicati "(n)" presenti in
"materiale di lavoro". Nessun file viene toccato: la scelta è redazionale.

## Campi previsti ma non ancora popolati (predisposizione futura)

- Pratica: `fase`, `tecnica` — da aggiungere in `pratica.html`.
- Storia: `periodo`, `area geografica` — per la futura cronologia navigabile.
- Sistemi: schede extra UE — aggiungere record con `"gruppo":"Extra UE"` in `data/sistemi.js`.

## Regole editoriali

1. Non pubblicare voci senza fonte o percorso d'archivio.
2. Le classificazioni automatiche (euristiche) restano dichiarate come tali finché non verificate.
3. Le sezioni incomplete portano l'avviso "in corso di redazione": rimuoverlo solo a lavoro fatto.
