/* Invarianti di accessibilità delle tabelle dati (obiettivo fase 2, punto 5):
   sulle pagine di statistiche e sui cataloghi principali ogni tabella deve
   - stare in un contenitore scrollabile .tbl-wrap con role="region";
   - avere una <caption>;
   - esporre almeno un'intestazione con scope="col".
   Esecuzione: node tests/test-tabelle.js */
"use strict";
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var PAGINE = [
  "statistiche.html",
  "avvocati-nel-mondo.html",
  "giudici-nel-mondo.html",
  "background-mediatori.html",
  "registri-mediazione.html",
  "banche-dati-paese.html"
];
var errori = [];

function conta(t, re) { return (t.match(re) || []).length; }

PAGINE.forEach(function (nome) {
  var t = fs.readFileSync(path.join(ROOT, nome), "utf8");
  var tabelle = conta(t, /<table[\s>]/gi);
  if (tabelle === 0) { errori.push(nome + ": nessuna tabella trovata"); return; }

  var caption = conta(t, /<caption[\s>]/gi);
  var region = conta(t, /class="tbl-wrap"[^>]*role="region"|role="region"[^>]*class="tbl-wrap"/gi);
  var scope = conta(t, /scope="col"/gi);

  if (caption !== tabelle)
    errori.push(nome + ": " + tabelle + " tabelle ma " + caption + " <caption>");
  if (region !== tabelle)
    errori.push(nome + ": " + tabelle + " tabelle ma " + region + " wrapper role=region");
  if (scope < tabelle)
    errori.push(nome + ": attesi almeno " + tabelle + " th scope=col, trovati " + scope);
});

console.log("Tabelle dati verificate su " + PAGINE.length + " pagine.");
if (errori.length) {
  console.error("\nInvarianti tabelle violate (" + errori.length + "):");
  errori.forEach(function (e) { console.error("  " + e); });
  process.exit(1);
}
console.log("\nOgni tabella ha wrapper role=region, caption e intestazioni con scope.");
