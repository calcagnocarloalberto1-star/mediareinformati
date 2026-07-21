/* Invarianti di struttura semantica (obiettivo fase 2, punto 2):
   - ogni pagina di contenuto ha esattamente un <h1> nel corpo (escludendo il
     contenuto di <script>/<style>, dove compaiono h1 solo negli export Word);
   - ogni pagina di contenuto ha esattamente un <main>;
   - lo skip-link punta a un id realmente presente nella pagina.

   Esclusi: i file di verifica dei motori di ricerca (google*.html), privi di
   markup di pagina. Esecuzione: node tests/test-struttura.js */
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var errori = [];

function elenca(dir, acc) {
  acc = acc || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (d) {
    if (d.name === ".git" || d.name === "node_modules" || d.name === "tests") return;
    var p = path.join(dir, d.name);
    if (d.isDirectory()) elenca(p, acc);
    else if (d.isFile() && /\.html$/i.test(d.name)) acc.push(p);
  });
  return acc;
}

// Rimuove il contenuto di <script> e <style>: gli h1/main che vi compaiono
// appartengono a documenti generati (export Word), non alla pagina.
function soloMarkup(t) {
  return t.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

// Esclusi anche gli strumenti interattivi in strumenti/ (sistema "olismo",
// con struttura e design system propri: cfr. tests/test-html-invariants.js).
function inStrumenti(f) { return path.relative(ROOT, f).indexOf("strumenti" + path.sep) === 0; }
function escluso(f) {
  return /^google[0-9a-z]+\.html$/i.test(path.basename(f)) || inStrumenti(f);
}

elenca(ROOT).forEach(function (f) {
  if (escluso(f)) return;
  var rel = path.relative(ROOT, f);
  var markup = soloMarkup(fs.readFileSync(f, "utf8"));

  var h1 = (markup.match(/<h1[\s>]/gi) || []).length;
  if (h1 !== 1) errori.push(rel + ": attesi 1 <h1>, trovati " + h1);

  var main = (markup.match(/<main[\s>]/gi) || []).length;
  if (main !== 1) errori.push(rel + ": attesi 1 <main>, trovati " + main);

  // I dossier hanno tutti un BreadcrumbList JSON-LD: devono esporre anche
  // le briciole visibili corrispondenti (obiettivo fase 2, punto 3).
  if (path.relative(ROOT, f).indexOf("dossier" + path.sep) === 0) {
    if (markup.indexOf('class="briciole"') === -1)
      errori.push(rel + ": manca il breadcrumb visibile (.briciole)");
    if (fs.readFileSync(f, "utf8").indexOf("BreadcrumbList") === -1)
      errori.push(rel + ": manca il BreadcrumbList JSON-LD");
  }

  // Coerenza dello skip-link: se presente e punta a un frammento locale,
  // l'id di destinazione deve esistere nel markup.
  var sk = markup.match(/href="#([^"]+)"[^>]*class="skip-link"|class="skip-link"[^>]*href="#([^"]+)"/i);
  if (sk) {
    var id = sk[1] || sk[2];
    var re = new RegExp('id="' + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"');
    if (!re.test(markup)) errori.push(rel + ": skip-link punta a #" + id + " ma l'id non esiste");
  }
});

console.log("Pagine di contenuto verificate per struttura semantica.");
if (errori.length) {
  console.error("\nInvarianti di struttura violate (" + errori.length + "):");
  errori.forEach(function (e) { console.error("  " + e); });
  process.exit(1);
}
console.log("\nOgni pagina ha un solo <h1>, un solo <main> e skip-link coerente.");
