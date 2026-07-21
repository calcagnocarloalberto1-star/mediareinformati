/* Test della sanitizzazione URL di assistente.js (renderAI).
   Estrae le funzioni safeUrl/escAttr dal sorgente reale ed esegue i casi limite:
   javascript:, offuscamento con spazi/controlli, quote injection, URL validi.
   Esecuzione: node tests/test-sanitize-url.js */
"use strict";
var fs = require("fs");
var path = require("path");

var src = fs.readFileSync(path.join(__dirname, "..", "assistente.js"), "utf8");

// Ricava il corpo delle funzioni dal sorgente, così il test verifica il codice reale.
function estrai(nome) {
  var re = new RegExp("function\\s+" + nome + "\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n  \\}");
  var m = re.exec(src);
  if (!m) throw new Error("Funzione non trovata nel sorgente: " + nome);
  return m[0];
}

/* eslint-disable no-eval */
var sandbox = estrai("esc") + "\n" + estrai("escAttr") + "\n" + estrai("safeUrl") +
  "\n;({esc:esc, escAttr:escAttr, safeUrl:safeUrl});";
var api = eval(sandbox);
var safeUrl = api.safeUrl, escAttr = api.escAttr;

var casi = [
  ["javascript:alert(1)", "#"],
  ["JaVaScRiPt:alert(1)", "#"],
  ["java\tscript:alert(1)", "#"],
  ["  javascript:alert(1)", "#"],
  ["javascript:alert(1)", "#"],
  ["data:text/html,<script>", "#"],
  ["vbscript:msgbox", "#"],
  ["file:///etc/passwd", "#"],
  ["https://example.com/a?b=1", "https://example.com/a?b=1"],
  ["http://x.it", "http://x.it"],
  ["diritto.html", "diritto.html"],
  ["#frammento", "#frammento"],
  ["//cdn.example.com/x", "//cdn.example.com/x"],
  ["", "#"],
  [null, "#"],
  [undefined, "#"]
];

var falliti = 0;
casi.forEach(function (c) {
  var out = safeUrl(c[0]);
  var ok = out === c[1];
  if (!ok) falliti++;
  console.log((ok ? "PASS" : "FAIL") + "  safeUrl(" + JSON.stringify(c[0]) + ") = " + JSON.stringify(out) +
    (ok ? "" : "  (atteso " + JSON.stringify(c[1]) + ")"));
});

// quote injection: dopo escAttr non devono restare apici doppi grezzi
var iniezione = '" onmouseover="alert(1)';
var escaped = escAttr(safeUrl(iniezione));
var senzaApici = escaped.indexOf('"') === -1;
console.log((senzaApici ? "PASS" : "FAIL") + "  escAttr neutralizza le quote: " + JSON.stringify(escaped));
if (!senzaApici) falliti++;

if (falliti) {
  console.error("\n" + falliti + " test falliti.");
  process.exit(1);
}
console.log("\nTutti i test di sanitizzazione URL superati.");
