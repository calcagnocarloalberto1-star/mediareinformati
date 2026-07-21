/* Verifica dei collegamenti interni e degli asset locali.
   Esegue la scansione di tutti i file .html del repository, estrae gli
   attributi href/src e controlla che ogni destinazione locale (percorso
   relativo o root-relative) corrisponda a un file realmente presente.
   Ignora URL esterni (http/https//), mailto:, tel:, data:, javascript: e i
   frammenti (#...). Esecuzione: node tests/test-links.js */
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

function elencaHtml(dir, acc) {
  acc = acc || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (d) {
    if (d.name === ".git" || d.name === "node_modules") return;
    var p = path.join(dir, d.name);
    if (d.isDirectory()) elencaHtml(p, acc);
    else if (d.isFile() && /\.html$/i.test(d.name)) acc.push(p);
  });
  return acc;
}

function esterno(u) {
  return /^(https?:)?\/\//i.test(u) || /^(mailto:|tel:|data:|javascript:|#)/i.test(u);
}

var htmls = elencaHtml(ROOT);
var rotti = [];
var controllati = 0;
var re = /(?:href|src)\s*=\s*"([^"]*)"/gi;

htmls.forEach(function (file) {
  var testo = fs.readFileSync(file, "utf8");
  var m;
  while ((m = re.exec(testo))) {
    var raw = m[1].trim();
    if (!raw || esterno(raw)) continue;
    var senza = raw.split("#")[0].split("?")[0];
    if (!senza) continue;
    var target;
    if (senza[0] === "/") target = path.join(ROOT, senza.slice(1));
    else target = path.join(path.dirname(file), senza);
    // una destinazione che termina con "/" indica una cartella (index implicito)
    if (/\/$/.test(senza)) target = path.join(target, "index.html");
    controllati++;
    if (!fs.existsSync(target)) {
      rotti.push({ file: path.relative(ROOT, file), link: raw });
    }
  }
});

console.log("File HTML analizzati: " + htmls.length);
console.log("Collegamenti locali controllati: " + controllati);
if (rotti.length) {
  console.error("\nCollegamenti interni rotti (" + rotti.length + "):");
  rotti.forEach(function (r) { console.error("  [" + r.file + "] -> " + r.link); });
  process.exit(1);
}
console.log("\nTutti i collegamenti interni risolvono a file esistenti.");
