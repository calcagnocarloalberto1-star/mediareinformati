/* Allinea il campo <lastmod> di ogni URL della sitemap alla data dell'ultimo
   commit git che ha toccato il file corrispondente. La data è ricavata da git
   e non inventata: se git non offre un dato attendibile per un file, quell'URL
   resta senza <lastmod> anziché riportare una data falsa.

   Su un clone shallow "git log -1 -- file" restituisce la data del commit di
   confine (non la vera ultima modifica) per i file toccati prima del confine:
   la sitemap risulterebbe con date errate rispetto a un ambiente con storia
   completa (es. la CI con fetch-depth: 0). Per questo lo script rifiuta di
   operare su un repository shallow, in entrambe le modalità.

   Mappatura URL → file: si rimuove il prefisso del dominio; l'URL della home
   ("https://mediareinformati.it/") corrisponde a index.html.

   Uso:  node tools/aggiorna-sitemap.js          (aggiorna sitemap.xml)
         node tools/aggiorna-sitemap.js --check   (esce con codice 1 se
                                                   qualcosa sarebbe cambiato)
   Requisiti: git nel PATH, storia completa (git fetch --unshallow) ed
   esecuzione dentro il repository. */
"use strict";
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var SITEMAP = path.join(ROOT, "sitemap.xml");
var BASE = "https://mediareinformati.it/";
var check = process.argv.indexOf("--check") !== -1;

// Su storia shallow le date git non sono affidabili: meglio interrompere
// con un messaggio chiaro che generare/validare una sitemap con date errate.
(function verificaStoriaCompleta() {
  var shallow;
  try {
    shallow = cp.execSync("git rev-parse --is-shallow-repository", {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch (e) { return; } // git non disponibile: gestito più avanti file per file.
  if (shallow === "true") {
    console.error("Errore: repository git shallow. Le date <lastmod> sarebbero " +
      "inattendibili. Esegui 'git fetch --unshallow' e riprova.");
    process.exit(1);
  }
})();

function fileDaLoc(loc) {
  var rel = loc.indexOf(BASE) === 0 ? loc.slice(BASE.length) : null;
  if (rel === null) return null;
  if (rel === "") rel = "index.html";
  return rel;
}

function dataUltimoCommit(rel) {
  var p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  var out;
  try {
    out = cp.execSync("git log -1 --format=%ad --date=short -- " + JSON.stringify(rel), {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch (e) { return null; }
  return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
}

var xml = fs.readFileSync(SITEMAP, "utf8");
var mancanti = [];
var aggiornati = [];

var nuovo = xml.replace(/<url>([\s\S]*?)<\/url>/g, function (blocco) {
  var m = blocco.match(/<loc>([^<]+)<\/loc>/);
  if (!m) return blocco;
  var rel = fileDaLoc(m[1]);
  var data = rel ? dataUltimoCommit(rel) : null;

  // Rimuove un eventuale <lastmod> preesistente per ricalcolarlo.
  var pulito = blocco.replace(/<lastmod>[^<]*<\/lastmod>/g, "");
  if (!data) {
    if (rel) mancanti.push(rel);
    return pulito;
  }
  // Inserisce <lastmod> subito dopo </loc>.
  var conData = pulito.replace(/(<\/loc>)/, "$1<lastmod>" + data + "</lastmod>");

  var vecchia = (blocco.match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1] || "";
  if (vecchia !== data) aggiornati.push(rel + " → " + data);
  return conData;
});

if (check) {
  var problemi = aggiornati.length;
  if (aggiornati.length) {
    console.error("sitemap: <lastmod> non allineato al git per " + aggiornati.length + " URL:");
    aggiornati.forEach(function (c) { console.error("  " + c); });
  }
  if (mancanti.length) {
    console.error("sitemap: nessuna data git per " + mancanti.length + " file: " + mancanti.join(", "));
  }
  if (problemi) process.exit(1);
  console.log("sitemap: <lastmod> allineato all'ultimo commit git per ogni URL.");
} else {
  if (nuovo !== xml) fs.writeFileSync(SITEMAP, nuovo);
  aggiornati.forEach(function (c) { console.log("aggiornato " + c); });
  if (mancanti.length) console.log("senza data git (saltati): " + mancanti.join(", "));
  console.log(aggiornati.length ? aggiornati.length + " URL aggiornati." : "Nessun aggiornamento necessario.");
}
