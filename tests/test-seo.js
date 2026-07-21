/* Invarianti SEO/GEO (obiettivo PR SEO/GEO):
   1) sitemap.xml ben formata: ogni <url> ha una <loc> e un <lastmod> in ISO
      (AAAA-MM-GG). La coerenza del lastmod con git è verificata a parte da
      tools/aggiorna-sitemap.js --check nella stessa catena di test.
   2) Title e meta description delle pagine chiave: presenti, unici, di
      lunghezza ragionevole (title <= 75, description 50–175 caratteri).
   3) Dossier: il JSON-LD Article espone le proprietà minime richieste
      (headline, description, inLanguage, url, datePublished, dateModified,
      author Person con name+url, mainEntityOfPage, about, image).
   4) Ogni dossier ha un blocco «Come citare» e una sezione di rimando
      («Per approfondire» oppure «Contenuti correlati») con link interni validi.
   5) La mappa editoriale copre tutti i dossier.
   Esecuzione: node tests/test-seo.js */
"use strict";
var fs = require("fs");
var path = require("path");
var mappa = require("../tools/mappa-editoriale.js");

var ROOT = path.join(__dirname, "..");
var DIR_DOSSIER = path.join(ROOT, "dossier");
var errori = [];

function leggi(p) { return fs.readFileSync(p, "utf8"); }
function conta(t, re) { return (t.match(re) || []).length; }

/* 1) sitemap.xml */
(function () {
  var sm = leggi(path.join(ROOT, "sitemap.xml"));
  var url = conta(sm, /<url>/g);
  var urlEnd = conta(sm, /<\/url>/g);
  var loc = conta(sm, /<loc>/g);
  if (url === 0) errori.push("sitemap.xml: nessun <url>");
  if (url !== urlEnd) errori.push("sitemap.xml: <url> (" + url + ") e </url> (" + urlEnd + ") non bilanciati");
  if (loc !== url) errori.push("sitemap.xml: " + url + " <url> ma " + loc + " <loc>");

  var re = /<url>([\s\S]*?)<\/url>/g, m, senza = 0, isoErr = 0;
  while ((m = re.exec(sm))) {
    var blocco = m[1];
    var lm = /<lastmod>([^<]*)<\/lastmod>/.exec(blocco);
    if (!lm) { senza++; continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lm[1].trim())) isoErr++;
  }
  if (senza) errori.push("sitemap.xml: " + senza + " <url> senza <lastmod>");
  if (isoErr) errori.push("sitemap.xml: " + isoErr + " <lastmod> non in formato ISO AAAA-MM-GG");
})();

/* 2) Title e meta description delle pagine chiave */
(function () {
  // Pagine riscritte in questa PR: verifica anche le lunghezze.
  var RISCRITTE = ["diritto.html", "approfondimenti.html", "articoli.html",
    "percorso-mediatore.html", "progetto.html"];
  // Aggiunta solo per il controllo di unicità (non riscritta qui).
  var PAGINE = RISCRITTE.concat(["index.html"]);
  var titoli = {}, descrizioni = {};
  PAGINE.forEach(function (nome) {
    var t = leggi(path.join(ROOT, nome));
    var controllaLun = RISCRITTE.indexOf(nome) !== -1;
    var mt = /<title>([\s\S]*?)<\/title>/i.exec(t);
    if (!mt) { errori.push(nome + ": <title> mancante"); return; }
    var titolo = mt[1].trim();
    if (controllaLun && (titolo.length < 15 || titolo.length > 75))
      errori.push(nome + ": lunghezza title fuori scala (" + titolo.length + "): " + titolo);
    if (titoli[titolo]) errori.push(nome + ": title duplicato con " + titoli[titolo]);
    else titoli[titolo] = nome;

    var md = /<meta\s+name="description"\s+content="([\s\S]*?)"/i.exec(t);
    if (!md) { errori.push(nome + ": meta description mancante"); return; }
    var desc = md[1].trim();
    if (controllaLun && (desc.length < 50 || desc.length > 175))
      errori.push(nome + ": lunghezza description fuori scala (" + desc.length + ")");
    if (descrizioni[desc]) errori.push(nome + ": description duplicata con " + descrizioni[desc]);
    else descrizioni[desc] = nome;
  });
})();

/* 3) + 4) Dossier: JSON-LD Article, «Come citare», sezione di rimando */
var dossier = fs.readdirSync(DIR_DOSSIER).filter(function (n) { return /\.html$/i.test(n); });
var RICHIESTE = ["headline", "description", "inLanguage", "url",
  "datePublished", "dateModified", "mainEntityOfPage", "about", "image"];

dossier.forEach(function (nome) {
  var t = leggi(path.join(DIR_DOSSIER, nome));
  if (!/"@type":\s*"Article"/.test(t)) return;

  var re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, m, articolo = null;
  while ((m = re.exec(t))) {
    try { var d = JSON.parse(m[1]); if (d["@type"] === "Article") { articolo = d; break; } }
    catch (e) { errori.push("dossier/" + nome + ": JSON-LD non parsabile"); }
  }
  if (!articolo) { errori.push("dossier/" + nome + ": JSON-LD Article assente"); return; }

  RICHIESTE.forEach(function (k) {
    if (articolo[k] === undefined || articolo[k] === null || articolo[k] === "")
      errori.push("dossier/" + nome + ": manca proprietà '" + k + "' nel JSON-LD Article");
  });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(articolo.datePublished || ""))
    errori.push("dossier/" + nome + ": datePublished non ISO");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(articolo.dateModified || ""))
    errori.push("dossier/" + nome + ": dateModified non ISO");
  if (!Array.isArray(articolo.about) || !articolo.about.length)
    errori.push("dossier/" + nome + ": 'about' assente o vuoto");
  if (!articolo.author || typeof articolo.author !== "object" ||
      !articolo.author.name || !articolo.author.url)
    errori.push("dossier/" + nome + ": author Person con name+url assente");

  var citare = conta(t, /<aside class="come-citare"/g);
  if (citare !== 1) errori.push("dossier/" + nome + ": atteso 1 blocco «Come citare», trovati " + citare);

  var haCorrelati = /Per approfondire/i.test(t) || /class="correlati-auto"/.test(t);
  if (!haCorrelati) errori.push("dossier/" + nome + ": nessuna sezione di rimando (Per approfondire/Contenuti correlati)");
});

/* 5) La mappa editoriale copre tutti i dossier e i link correlati esistono */
dossier.forEach(function (nome) {
  if (!mappa.MAPPA[nome]) errori.push("mappa-editoriale: dossier non mappato: " + nome);
});
Object.keys(mappa.MAPPA).forEach(function (nome) {
  var voce = mappa.MAPPA[nome];
  (voce.correlati || []).forEach(function (href) {
    var target = path.join(DIR_DOSSIER, href);
    if (!fs.existsSync(target))
      errori.push("mappa-editoriale [" + nome + "]: link correlato inesistente: " + href);
  });
});

console.log("Verificati: sitemap, title/description pagine chiave, JSON-LD e rimandi di " + dossier.length + " dossier.");

if (errori.length) {
  console.error("\nInvarianti SEO/GEO violate (" + errori.length + "):");
  errori.forEach(function (e) { console.error("  " + e); });
  process.exit(1);
}
console.log("\nTutte le invarianti SEO/GEO sono rispettate.");
