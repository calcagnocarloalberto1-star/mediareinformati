/* Arricchisce ogni dossier in modo riproducibile e idempotente:

   1) JSON-LD Article: aggiunge mainEntityOfPage, image (og-cover), about (dai
      temi della mappa editoriale) e author.url (→ progetto.html). Conserva
      headline, description, inLanguage, url, datePublished (verificata) e
      dateModified (già derivata da git). Non inventa date né proprietà.
   2) Blocco "Come citare" uniforme (autore, sito, data di ultimo aggiornamento
      verificata + disclaimer), come <aside class="come-citare">.
   3) "Contenuti correlati": link interni dalla mappa editoriale, inseriti solo
      nei dossier privi di una sezione di rimando ("Per approfondire"), per non
      duplicare i link già curati nel corpo.

   Uso:  node tools/arricchisci-dossier.js          (aggiorna i dossier)
         node tools/arricchisci-dossier.js --check   (esce 1 se cambierebbe qualcosa)
*/
"use strict";
var fs = require("fs");
var path = require("path");
var mappa = require("./mappa-editoriale.js");

var ROOT = path.join(__dirname, "..");
var DIR = path.join(ROOT, "dossier");
var BASE = "https://mediareinformati.it/dossier/";
var IMG = "https://mediareinformati.it/assets/og-cover.png";
var AUTORE_URL = "https://mediareinformati.it/progetto.html";
var check = process.argv.indexOf("--check") !== -1;

var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

function dataItaliana(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return parseInt(m[3], 10) + " " + MESI[parseInt(m[2], 10) - 1] + " " + m[1];
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Sostituisce il contenuto dello <script> ld+json di tipo Article.
function arricchisciJsonLd(testo, nome, avvisi) {
  var re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  return testo.replace(re, function (blocco, json) {
    var dati;
    try { dati = JSON.parse(json); } catch (e) { return blocco; }
    if (dati["@type"] !== "Article") return blocco;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dati.datePublished || "")) {
      avvisi.push(nome + ": datePublished mancante o non valida");
    }
    dati.mainEntityOfPage = { "@type": "WebPage", "@id": dati.url };
    dati.image = IMG;
    if (dati.author && typeof dati.author === "object") dati.author.url = AUTORE_URL;
    var temi = (mappa.MAPPA[nome] && mappa.MAPPA[nome].about) || [];
    if (temi.length) {
      dati.about = temi.map(function (t) { return { "@type": "Thing", "name": t }; });
    }
    return '<script type="application/ld+json">' + JSON.stringify(dati) + "</script>";
  });
}

function headlineDi(testo, nome) {
  var m = /"headline":\s*"([^"]+)"/.exec(testo);
  if (m) return m[1];
  var h = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(testo);
  return h ? h[1].replace(/<[^>]+>/g, "").trim() : nome;
}

function dateModifiedDi(testo) {
  var m = /"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/.exec(testo);
  return m ? m[1] : null;
}

function bloccoCitare(nome, titolo, iso) {
  var url = BASE + nome;
  return '<aside class="come-citare" aria-label="Come citare questa pagina">' +
    "<h2>Come citare questa pagina</h2>" +
    "<p>Carlo Alberto Calcagno, «" + esc(titolo) + "», " +
    "<cite>mediareinformati.it</cite>" +
    (iso ? ", aggiornato al " + esc(dataItaliana(iso)) : "") +
    ". URL: <span class=\"cc-url\">" + esc(url) + "</span>.</p>" +
    '<p class="cc-nota">Dossier redazionale di consultazione: verificare sempre le ' +
    "fonti citate. Non costituisce né sostituisce un parere legale.</p>" +
    "</aside>";
}

function bloccoCorrelati(nome) {
  var voce = mappa.MAPPA[nome];
  if (!voce || !voce.correlati || !voce.correlati.length) return "";
  var li = voce.correlati.map(function (href) {
    var testo = mappa.ETICHETTE[href] || href;
    return '<li><a href="' + href + '">' + esc(testo) + "</a></li>";
  }).join("");
  return '<nav class="correlati-auto" aria-label="Contenuti correlati">' +
    "<h2>Contenuti correlati</h2><ul>" + li + "</ul></nav>";
}

var files = fs.readdirSync(DIR).filter(function (n) { return /\.html$/i.test(n); });
var cambiati = [];
var avvisi = [];

files.forEach(function (nome) {
  var p = path.join(DIR, nome);
  var t0 = fs.readFileSync(p, "utf8");
  if (!/"@type":\s*"Article"/.test(t0)) return;

  var t = arricchisciJsonLd(t0, nome, avvisi);

  // Rimuove eventuali blocchi generati in precedenza (idempotenza).
  t = t.replace(/<aside class="come-citare"[\s\S]*?<\/aside>/g, "");
  t = t.replace(/<nav class="correlati-auto"[\s\S]*?<\/nav>/g, "");

  var haCurati = /Per approfondire/i.test(t);
  var titolo = headlineDi(t, nome);
  var iso = dateModifiedDi(t);

  var inserimento = (haCurati ? "" : bloccoCorrelati(nome)) + bloccoCitare(nome, titolo, iso);

  var ancora = t.indexOf('<div class="avviso-provvisorio"');
  if (ancora === -1) { avvisi.push(nome + ": ancora avviso-provvisorio non trovata"); return; }
  t = t.slice(0, ancora) + inserimento + t.slice(ancora);

  if (t !== t0) {
    cambiati.push(nome);
    if (!check) fs.writeFileSync(p, t);
  }
});

avvisi.forEach(function (a) { console.error("avviso: " + a); });

if (check) {
  if (cambiati.length) {
    console.error("Dossier non allineati (" + cambiati.length + "): " + cambiati.join(", "));
    process.exit(1);
  }
  console.log("Dossier: JSON-LD, 'Come citare' e 'Contenuti correlati' allineati.");
} else {
  console.log(cambiati.length ? "Aggiornati " + cambiati.length + " dossier: " + cambiati.join(", ")
    : "Nessun aggiornamento necessario.");
}
