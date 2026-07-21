# Migrazione a una Content-Security-Policy

Questo documento definisce una Content-Security-Policy (CSP) di destinazione per
`mediareinformati.it` e i passi concreti per adottarla. La CSP **non è ancora
attiva**: applicarla oggi romperebbe funzionalità del sito, quindi la fase 2 si
ferma alla progettazione, come previsto dall'obiettivo (applicare solo se gli
script/stili inline si possono eliminare o hashare correttamente e i test
funzionali passano).

## Perché non è applicabile adesso

Il sito è statico e pubblicato su GitHub Pages: non c'è un server applicativo
che possa impostare header HTTP o generare un `nonce` per richiesta. L'unica via
è il tag `<meta http-equiv="Content-Security-Policy">`, che **non supporta i
nonce** e obbliga quindi a elencare gli hash di ogni script/stile inline.

Lo stato attuale del codice contiene molte risorse inline non ancora hashabili
in modo pratico:

| Elemento inline                              | File coinvolti (circa) |
|----------------------------------------------|------------------------|
| Gestori di evento inline (`onclick=…` ecc.)  | 28                     |
| Blocchi `<script>` inline (senza `src`)      | 48                     |
| Blocchi `<style>` inline                     | 77                     |

I gestori di evento inline (es. `onclick="setAll(false)"` in `mappa.html`) sono
il vincolo più duro: non sono coperti dagli hash `script-src` e richiederebbero
`'unsafe-inline'` oppure `'unsafe-hashes'` + hash dedicato, vanificando gran
parte del beneficio. Vanno rimossi prima di poter chiudere la policy.

## Origini esterne da autorizzare

Rilevate nel codice attuale:

- **script**: `https://cdnjs.cloudflare.com` (pako), `https://cdn.jsdelivr.net`
  (jspdf, solo in `strumenti/calcolo-assegni/`).
- **style**: `https://fonts.googleapis.com`.
- **font**: `https://fonts.gstatic.com`.
- **connect** (fetch dell'assistente): i Cloudflare Worker
  `https://proud-limit-e448.calcagnocarloalberto1.workers.dev` e
  `https://olismo-proxy.calcagnocarloalberto1.workers.dev`.
- **img**: dominio del sito e `data:` (favicon/OG inline eventuali).

`https://tuo-worker.tuo-account.workers.dev` è un segnaposto in un file di
esempio: non va incluso nella policy di produzione.

## Policy di destinazione

Da servire idealmente come header HTTP (se in futuro si passa a un CDN/proxy che
lo consente) oppure via `<meta http-equiv>` una volta rimossi gli inline:

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'self';
form-action 'self';
img-src 'self' data:;
font-src 'self' https://fonts.gstatic.com;
style-src 'self' https://fonts.googleapis.com;
script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;
connect-src 'self' https://proud-limit-e448.calcagnocarloalberto1.workers.dev https://olismo-proxy.calcagnocarloalberto1.workers.dev;
upgrade-insecure-requests
```

Note:
- Nessun `'unsafe-inline'` né `'unsafe-eval'`.
- Mantenere la SRI già presente sugli script da CDN (pako) ed estenderla a
  jspdf.
- `style-src` non usa hash: dopo l'esternalizzazione degli stili inline resta
  solo il CSS di `fonts.googleapis.com` (che serve `<link>`, non inline).

## Passi concreti

1. **Eliminare i gestori di evento inline** (28 file): sostituire ogni
   `on*="…"` con `addEventListener` in uno script esterno o in coda al blocco
   già presente. È il prerequisito per non usare `'unsafe-inline'`.
2. **Esternalizzare gli script inline** (48 file): spostare la logica in file
   sotto `assets/` (o per-pagina) referenziati con `<script src>`. Dove lo
   script inline è minimo e specifico della pagina, in alternativa calcolarne
   l'hash `sha256` e aggiungerlo a `script-src`.
3. **Esternalizzare gli stili inline** (77 file): spostare i `<style>` di pagina
   in fogli CSS dedicati. In gran parte sono già sovrapponibili a
   `assets/style.css`; il resto può diventare `assets/pagina-*.css`.
4. **Aggiungere un test di regressione** che verifichi l'assenza di `on*=` e di
   `<script>`/`<style>` inline nelle pagine, così da non reintrodurli.
5. **Fase Report-Only**: pubblicare prima
   `Content-Security-Policy-Report-Only` (via `<meta>` o header) e osservare le
   violazioni su un campione di pagine reali, poi promuovere a `Content-Security-Policy`.
6. **Verifica funzionale**: assistente/ricerca, export Word/PDF, mappa
   interattiva, strumenti in `strumenti/`, lazy-load dei dati. Solo se tutto
   passa, chiudere la policy.

## Stato

- [x] Policy di destinazione definita.
- [x] Origini esterne censite.
- [ ] Rimozione gestori inline.
- [ ] Esternalizzazione script inline.
- [ ] Esternalizzazione stili inline.
- [ ] Fase Report-Only e verifica.
- [ ] Attivazione CSP.
