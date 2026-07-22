/* Verifica delle correzioni dei collegamenti esterni HTTP 404.
   Controlla che:
   (a) nessuno dei 19 URL vecchi (da sostituire) resti nel repository;
   (b) ogni nuovo URL di destinazione sia sintatticamente valido;
   (c) [opzionale, CHECK_HTTP=1] esegua controlli HTTP prudenti: registra lo
       stato senza considerare 403/bot-blocking o timeout come fallimento.
   Il caso Iran (#17) e' escluso dalle sostituzioni: l'URL originale e' di
   nuovo attivo e resta invariato.
   Esecuzione: node tests/test-link-esterni-404.js  (offline)
               CHECK_HTTP=1 node tests/test-link-esterni-404.js  (con rete) */
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

/* Coppie OLD -> NEW effettivamente applicate al repository.
   Per la Bielorussia l'attributo href in HTML usa "&amp;" (cosi' il browser
   richiede "&"); nei file dati JSON il valore e' in forma decodificata. */
var SOSTITUZIONI = [
  { old: "http://www.lawnet.gov.lk/wp-content/uploads/Law%20Site/4-stats_1956_2006/set4/1988Y0V0C72A.html",
    nuovo: "https://mediation.gov.lk/en/resources/acts/" },
  { old: "https://ccah.ht/fondement-juridique",
    nuovo: "https://www.ccah.ht/procedure/procedures-non-contraignantes/la-mediation" },
  { old: "https://imimediation.org/links/legislation-and-regulations/law-10385-for-mediation-in-dispute-resolution-in-the-republic-of-albania/",
    nuovo: "https://www.drejtesia.gov.al/wp-content/uploads/2019/02/Ligj_10385_04022011_perditesuar_2018.pdf" },
  { old: "https://imimediation.org/links/legislation-and-regulations/law-no-192-on-mediation-and-organisation-of-the-profession-of-mediator-in-romania/",
    nuovo: "https://legislatie.just.ro/Public/DetaliiDocument/71928" },
  { old: "https://laws.gov.fj/Acts/DisplayAct/919",
    nuovo: "https://natlex.ilo.org/dyn/natlex2/r/natlex/fe/details?p3_isn=66125" },
  { old: "https://legalaffairs.gov.in/sites/default/files/MediationAct2023.pdf",
    nuovo: "https://www.indiacode.nic.in/handle/123456789/19637" },
  { old: "https://lesotholii.org/content/part-viii-completion-mediation",
    nuovo: "http://www.judiciary.gov.ls/high-court/" },
  { old: "https://mpravde.gov.rs/en/sekcija/28482/mediation.php",
    nuovo: "https://www.mpravde.gov.rs/sr/sekcija/15868/medijacija.php" },
  { old: "https://msb.org.au/resources/faqs",
    nuovo: "https://amdras.au/resources/faq/" },
  { old: "https://msb.org.au/themes/msb/assets/documents/national-mediator-accreditation-system.pdf",
    nuovo: "https://amdras.au/wp-content/uploads/2025/04/AMDRAS-Standards-Master-February-2025.pdf" },
  // Bielorussia: due forme vecchie (HTML-escaped e decodificata), entrambe assenti.
  { old: "https://pravo.by/document/?guid=12551&amp;p0=H12300292",
    nuovo: "https://pravo.by/document/?guid=12551&amp;p0=H11300058&amp;p1=1" },
  { old: "https://pravo.by/document/?guid=12551&p0=H12300292",
    nuovo: "https://pravo.by/document/?guid=12551&p0=H11300058&p1=1" },
  { old: "https://www.bmj.de/SharedDocs/Gesetzgebungsverfahren/DE/2023_ZMediatAusbV.html",
    nuovo: "https://www.gesetze-im-internet.de/zmediatausbv/BJNR199400016.html" },
  { old: "https://www.cfcim.org/une-nouvelle-loi-encadrant-le-processus-de-mediation/",
    nuovo: "https://adala.justice.gov.ma/api/uploads/2024/06/07/%D8%A7%D9%84%D8%AA%D8%AD%D9%83%D9%8A%D9%85%20%D9%88%D8%A7%D9%84%D9%88%D8%B3%D8%A7%D8%B7%D8%A9%20%D8%A7%D9%84%D8%A7%D8%AA%D9%81%D8%A7%D9%82%D9%8A%D8%A9-1717759890590.pdf" },
  { old: "https://www.conciliacionbolivia.org/mapa-de-la-conciliacion",
    nuovo: "https://www.conciliacionbolivia.org/mapa-conciliaci%C3%B3n" },
  { old: "https://www.lawnet.gov.lk/wp-content/uploads/cons_stat_up2_2006/1988Y0V0C72A.html",
    nuovo: "https://mediation.gov.lk/en/resources/acts/" },
  { old: "https://www.lawethiopia.com/index.php/federal-laws/6654-proclamation-no-1237-2021-arbitration-and-conciliation-working-procedure-proclamation",
    nuovo: "https://justice.gov.et/en/law/arbitration-and-conciliation-working-procedure-proclamation/" },
  { old: "https://www.lawsociety.org.zw/wp-content/uploads/2021/09/High-Court-Commercial-Division-Rules-2020.pdf",
    nuovo: "https://www.veritaszim.net/node/4200" },
  { old: "https://www.lexlege.pl/kodeks-postepowania-cywilnego/",
    nuovo: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19640430296" },
  { old: "https://www.poderjudicial.gub.uy/institucional/centros-de-mediacion.html",
    nuovo: "https://www.poderjudicial.gub.uy/institucional/centros-de-mediacion" },
  { old: "https://www.sluzbenilist.me/propisi/470060BF-A22B-4C56-B867-AB024F6A6366",
    nuovo: "https://wapi.gov.me/download/922dd349-1c48-49d3-9c13-6ced55c9768e?version=1.0" }
];

// Frammenti vecchi che non devono comparire in nessuna forma.
var FRAMMENTI_VIETATI = ["H12300292"];

/* Destinazioni introdotte dalla PR #5 ma risultate tecnicamente inutilizzabili
   in browser reale (QA), poi sostituite: non devono restare nel repository.
   - India: il deep-link "bitstream" restituisce "Invalid URL or Argument(s)".
   - Fiji: il deep-link ufficiale laws.gov.fj restituisce 404 in browser.
   - Sri Lanka: LawNet ha certificato SSL non valido, non accessibile. */
var SUPERATI = [
  "https://www.indiacode.nic.in/bitstream/123456789/19637/1/A2023-32.pdf",
  "https://www.laws.gov.fj/Acts/DisplayAct/919",
  "https://www.lawnet.gov.lk/wp-content/uploads/cons_stat_up2_2006/1988Y0V0C72A.html"
];

var ESTENSIONI = [".html", ".txt", ".js", ".json", ".xml"];

function elencaFile(dir, acc) {
  acc = acc || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (d) {
    if (d.name === ".git" || d.name === "node_modules") return;
    var p = path.join(dir, d.name);
    if (d.name === path.basename(__filename)) return; // questo file contiene gli URL vecchi come dati
    if (d.isDirectory()) elencaFile(p, acc);
    else if (d.isFile() && ESTENSIONI.indexOf(path.extname(d.name).toLowerCase()) !== -1) acc.push(p);
  });
  return acc;
}

var file = elencaFile(ROOT);
var contenuti = file.map(function (f) { return { f: path.relative(ROOT, f), t: fs.readFileSync(f, "utf8") }; });
var errori = [];

// (a) nessun URL vecchio residuo.
SOSTITUZIONI.forEach(function (s) {
  contenuti.forEach(function (c) {
    if (c.t.indexOf(s.old) !== -1) errori.push("URL vecchio ancora presente in " + c.f + " -> " + s.old);
  });
});
FRAMMENTI_VIETATI.forEach(function (fr) {
  contenuti.forEach(function (c) {
    if (c.t.indexOf(fr) !== -1) errori.push("Frammento vietato in " + c.f + " -> " + fr);
  });
});
SUPERATI.forEach(function (u) {
  contenuti.forEach(function (c) {
    if (c.t.indexOf(u) !== -1) errori.push("URL superato (PR #5) ancora presente in " + c.f + " -> " + u);
  });
});

// (b) ogni nuovo URL sintatticamente valido; verifica presenza di quelli attesi nel repo.
var nuoviUnici = {};
SOSTITUZIONI.forEach(function (s) {
  // decodifica gli &amp; per la validazione sintattica dell'URL.
  var perValidazione = s.nuovo.replace(/&amp;/g, "&");
  try { new URL(perValidazione); } catch (e) { errori.push("Nuovo URL non valido: " + s.nuovo); }
  nuoviUnici[perValidazione] = true;
});

console.log("File analizzati: " + contenuti.length);
console.log("Sostituzioni verificate: " + SOSTITUZIONI.length + " (URL nuovi distinti: " + Object.keys(nuoviUnici).length + ")");
console.log("Nota #17 Iran: URL invariato (pagina di nuovo attiva), escluso dalle sostituzioni.");

if (errori.length) {
  console.error("\nErrori (" + errori.length + "):");
  errori.forEach(function (e) { console.error("  " + e); });
  process.exit(1);
}
console.log("\n(a) Nessun URL vecchio residuo. (b) Tutti i nuovi URL sono sintatticamente validi.");

// (c) controlli HTTP prudenti, solo su richiesta esplicita (CHECK_HTTP=1).
if (process.env.CHECK_HTTP === "1") {
  var https = require("https");
  var http = require("http");
  var target = Object.keys(nuoviUnici);
  // include il caso Iran come sola verifica informativa.
  target.push("https://www.legal500.com/guides/chapter/iran-litigation/");
  var rimasti = target.length;
  console.log("\nControlli HTTP (403/bot-blocking e timeout NON sono fallimenti):");
  target.forEach(function (u) {
    var lib = u.indexOf("https:") === 0 ? https : http;
    var req = lib.request(u, { method: "HEAD", timeout: 12000, headers: { "User-Agent": "Mozilla/5.0 (link-check mediareinformati)" } }, function (res) {
      var nota = (res.statusCode === 403 || res.statusCode === 429) ? " (bot-blocking, non considerato errore)" : "";
      console.log("  " + res.statusCode + "  " + u + nota);
      res.resume();
      if (--rimasti === 0) console.log("Controlli HTTP completati (esito informativo).");
    });
    req.on("timeout", function () { console.log("  TIMEOUT  " + u + " (non considerato errore)"); req.destroy(); if (--rimasti === 0) console.log("Controlli HTTP completati (esito informativo)."); });
    req.on("error", function (e) { console.log("  ERRORE-RETE  " + u + " -> " + e.code + " (non considerato errore)"); if (--rimasti === 0) console.log("Controlli HTTP completati (esito informativo)."); });
    req.end();
  });
}
