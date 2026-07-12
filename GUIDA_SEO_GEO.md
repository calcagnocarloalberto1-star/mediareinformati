# mediareinformati.it — Guida SEO & GEO

Questo pacchetto rende il sito ottimizzato sia per i **motori di ricerca** (SEO: Google, Bing) sia per i **motori generativi/IA** (GEO: ChatGPT, Perplexity, Google AI Overviews, Claude), così che le risposte dell'IA citino il sito con le sue fonti.

## File inclusi (da caricare nella cartella radice del sito)
- `index.html` — home riorganizzata, con `<head>` completo, dati strutturati JSON-LD e sezione «Domande frequenti».
- `robots.txt` — consente i crawler classici e quelli IA (GPTBot, PerplexityBot, Google-Extended, ClaudeBot, ecc.) e indica la sitemap.
- `sitemap.xml` — elenco delle 9 pagine con priorità.
- `llms.txt` e `llms-full.txt` — riassunto strutturato per i motori generativi (standard llmstxt.org), con i fatti chiave e le FAQ.
- `og-cover.png` — immagine di anteprima social 1200×630 (referenziata da `og:image`).

## Che cosa è già stato fatto (nella home)
- `<title>` e `<meta name="description">` unici e descrittivi.
- `<link rel="canonical">`, `lang="it"`, `hreflang` it / x-default, meta robots con `max-image-preview:large`.
- Open Graph + Twitter Card (con immagine).
- **JSON-LD**: `WebSite` (+ `SearchAction`), `Person` (autore, con sede Genova e profili collegati), `WebPage`, `BreadcrumbList`, `Book` con i volumi dell'opera, `FAQPage`.
- HTML semantico (header/nav/main/section/article/footer), un solo `<h1>`, gerarchia dei titoli corretta.
- Sezione **«Domande frequenti»** visibile e coerente con lo schema `FAQPage` (requisito per gli snippet Google e ottima per la citazione IA).

---

## 1) Meta per TUTTE le pagine (copia negli `<head>`)

| Pagina | `<title>` | `<meta description>` |
|---|---|---|
| index.html | Mediazione, il diritto della pace — mediareinformati.it | Archivio ragionato e interrogabile sulla mediazione: storia, diritto e comparazione mondiale su 195 ordinamenti. Gratis, con le fonti pubbliche in coda. |
| inizia.html | Inizia da qui: la guida rapida — mediareinformati.it | Avvocato, mediatore o formatore? Tre percorsi per trovare subito norma vigente, tecniche del tavolo, dossier e dati sulla mediazione. |
| storia.html | Storia della mediazione: 933 voci — mediareinformati.it | Le radici del comporre i conflitti: dai miti mesopotamici a Greci e Romani, fino alle leggi dal 1770 a oggi. Voci interrogabili, con le fonti. |
| diritto.html | Diritto e comparazione della mediazione 2026 — mediareinformati.it | La mediazione è obbligatoria? Norma vigente, d.lgs. 28/2010 e riforma Cartabia, 195 profili-Paese e 291 pronunce pronte da citare. |
| pratica.html | Pratica della mediazione: primo incontro e strumenti — mediareinformati.it | Preparare e condurre il primo incontro di mediazione: dispense, manuali operativi e 22 strumenti. Manuale integrale gratuito (584 pp.). |
| statistiche.html | Dati e corpus della mediazione — mediareinformati.it | Quanti mediatori nel mondo? Numeri della mediazione: serie DGSTAT 2011–2025, EU Justice Scoreboard 2026, tabelle Excel e dossier. |
| opera.html | L'Opera «Mediazione, il diritto della pace» — mediareinformati.it | L'opera di Carlo Alberto Calcagno: storia, Europa, avvocato negoziatore, mediazione nel mondo, comunicazione e corpus normativo dei 195 ordinamenti. |
| assistente.html | Assistente sulla mediazione, con le fonti — mediareinformati.it | Fai una domanda sulla mediazione: l'assistente compone una risposta sull'archivio, con le fonti, scaricabile in Word, PDF e slide. |
| progetto.html | Chi sono — Carlo Alberto Calcagno, mediatore a Genova | Avvocato, mediatore e formatore a Genova. Dal 2011 studia e insegna la mediazione: l'archivio, le opere e le fonti del progetto. |

## 2) `<head>` da mettere su OGNI pagina (sostituisci i valori)

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESCRIPTION}}">
<link rel="canonical" href="https://mediareinformati.it/{{FILE}}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="author" content="Carlo Alberto Calcagno">
<link rel="alternate" hreflang="it" href="https://mediareinformati.it/{{FILE}}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="mediareinformati.it">
<meta property="og:locale" content="it_IT">
<meta property="og:title" content="{{TITLE}}">
<meta property="og:description" content="{{DESCRIPTION}}">
<meta property="og:url" content="https://mediareinformati.it/{{FILE}}">
<meta property="og:image" content="https://mediareinformati.it/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
```
(sulla home `{{FILE}}` è vuoto, cioè `https://mediareinformati.it/`.)

## 3) JSON-LD aggiuntivi per pagine specifiche

**progetto.html** — pagina autore (rafforza E-E-A-T e la comparsa nei pannelli IA):
```json
{"@context":"https://schema.org","@type":"ProfilePage","mainEntity":{
 "@type":"Person","name":"Carlo Alberto Calcagno",
 "jobTitle":["Avvocato","Mediatore","Formatore"],
 "address":{"@type":"PostalAddress","addressLocality":"Genova","addressCountry":"IT"},
 "knowsAbout":["Mediazione","ADR","Negoziazione assistita","Diritto comparato","Storia dei sistemi di composizione dei conflitti"],
 "sameAs":["https://www.mediaresenzaconfini.org","https://www.calcolomediazione.it","https://www.olismo-integrato.it","https://www.enneagrammaevolutivo.it"],
 "author":[
  {"@type":"Book","name":"Breve storia della risoluzione del conflitto","datePublished":"2014","publisher":"Aracne"},
  {"@type":"Book","name":"Il legale e la mediazione","datePublished":"2014","publisher":"Aracne"},
  {"@type":"Book","name":"Manuale del geometra mediatore e conciliatore","datePublished":"2011","publisher":"UTET Scienze Tecniche"},
  {"@type":"Book","name":"Arbitrato e negoziato in Europa","datePublished":"2020","publisher":"Cendon/Book"}
 ]}}
```

**diritto.html** e **assistente.html** — `FAQPage`: riusa il blocco `FAQPage` già presente nella home (le stesse domande/risposte), rendendolo visibile in pagina.

**statistiche.html** — `Dataset` per le serie di dati:
```json
{"@context":"https://schema.org","@type":"Dataset","name":"Numeri della mediazione — Italia e mondo",
 "description":"Serie DGSTAT 2011–2025, EU Justice Scoreboard 2026, World Justice Project; mediatori per 195 ordinamenti.",
 "creator":{"@type":"Person","name":"Carlo Alberto Calcagno"},"license":"https://creativecommons.org/licenses/by-nc-nd/4.0/"}
```

**opera.html** — `Book` con `hasPart` (i volumi), come nella home.

Su ogni pagina interna aggiungi anche un `BreadcrumbList` (Home › Sezione).

---

## 4) GEO — perché l'IA citerà il sito
- `llms.txt`/`llms-full.txt` danno ai modelli una mappa e i fatti chiave già pronti, con la formula di citazione consigliata.
- Le risposte sono **auto-contenute** (domanda come titolo + risposta breve verificabile): è il formato che i motori generativi estraggono più facilmente.
- **E-E-A-T**: autore reale con biografia, opere edite, sede e profili collegati; fonti primarie sempre citate; date esplicite.
- `robots.txt` **consente** i crawler IA (scelta coerente con un sito che vuole essere citato). Se preferisci escluderne qualcuno, togli la relativa riga `Allow`.

## 5) Cosa devi fare tu (lato server/account — non automatizzabile da qui)
1. **HTTPS + canonicalizzazione dominio**: redirect 301 da `www` a `https://mediareinformati.it` (o viceversa) — un solo dominio canonico.
2. **Google Search Console** e **Bing Webmaster Tools**: verifica il dominio e invia `sitemap.xml`.
3. **`lastmod`** nella sitemap: aggiorna le date quando modifichi le pagine.
4. **Favicon**: aggiungi `favicon.ico` e `apple-touch-icon.png` in radice.
5. **Prestazioni**: il CSS è inline e leggero; comprimi le immagini grandi e abilita la cache/gzip sul server.
6. **Locale (Genova)**: se vuoi visibilità locale come professionista, crea/aggiorna un profilo Google Business e mantieni coerenti Nome-Indirizzo-Telefono (NAP) su tutti i siti della rete.
7. **IndexNow** (opzionale, per Bing): ping automatico agli aggiornamenti.

## 6) Prossimo passo consigliato
Applicare a `inizia.html`, `storia.html`, `diritto.html`, `pratica.html`, `statistiche.html`, `opera.html`, `assistente.html`, `progetto.html` lo stesso `<head>`, i colori per sezione e la struttura a card della home: posso generarti tutte e otto le pagine `.html` già pronte da caricare, con i rispettivi JSON-LD.
