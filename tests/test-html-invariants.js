/* Invarianti di igiene del repository verificabili senza servizi esterni:
   - nessun residuo dell'SDK Puter (js.puter.com), rimosso perché mai invocato;
   - nessun uso di var(--border) (la variabile non è definita: si usa --bordo);
   - ogni pagina HTML di primo livello ha almeno un <h1>;
   - assistente.js espone le funzioni di sanitizzazione (safeUrl/escAttr).
   Esecuzione: node tests/test-html-invariants.js */
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var errori = [];

function elenca(dir, filtro, acc) {
  acc = acc || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (d) {
    if (d.name === ".git" || d.name === "node_modules" || d.name === "tests") return;
    var p = path.join(dir, d.name);
    if (d.isDirectory()) elenca(p, filtro, acc);
    else if (d.isFile() && filtro.test(d.name)) acc.push(p);
  });
  return acc;
}

var htmls = elenca(ROOT, /\.html$/i);
var sorgenti = elenca(ROOT, /\.(html|js|css)$/i);
function inStrumenti(f) { return path.relative(ROOT, f).indexOf("strumenti" + path.sep) === 0; }

// 1) nessun residuo Puter
sorgenti.forEach(function (f) {
  if (fs.readFileSync(f, "utf8").indexOf("js.puter.com") !== -1)
    errori.push("Residuo Puter in " + path.relative(ROOT, f));
});

// 2) nessun var(--border) nel design system principale.
// Gli strumenti in strumenti/ (sistema "olismo") definiscono un proprio --border: esclusi.
sorgenti.filter(function (f) { return !inStrumenti(f); }).forEach(function (f) {
  if (fs.readFileSync(f, "utf8").indexOf("var(--border)") !== -1)
    errori.push("var(--border) non definita in " + path.relative(ROOT, f));
});

// 3) ogni pagina di contenuto di primo livello ha almeno un <h1>
// (esclusi i file di verifica dei motori di ricerca, privi di markup di pagina)
htmls.filter(function (f) {
  return path.dirname(f) === ROOT && !/^google[0-9a-f]+\.html$/i.test(path.basename(f));
}).forEach(function (f) {
  if (!/<h1[\s>]/i.test(fs.readFileSync(f, "utf8")))
    errori.push("Manca <h1> in " + path.relative(ROOT, f));
});

// 4) assistente.js espone la sanitizzazione URL
var ass = fs.readFileSync(path.join(ROOT, "assistente.js"), "utf8");
["function safeUrl", "function escAttr"].forEach(function (n) {
  if (ass.indexOf(n) === -1) errori.push("assistente.js: manca " + n);
});

console.log("Pagine HTML: " + htmls.length + " | sorgenti analizzati: " + sorgenti.length);
if (errori.length) {
  console.error("\nInvarianti violate (" + errori.length + "):");
  errori.forEach(function (e) { console.error("  " + e); });
  process.exit(1);
}
console.log("\nTutte le invarianti di igiene sono rispettate.");
