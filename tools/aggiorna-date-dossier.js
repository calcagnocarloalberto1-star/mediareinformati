/* Allinea il campo "dateModified" del JSON-LD Article di ogni dossier alla
   data dell'ultimo commit git che ha toccato il file. Serve a mantenere i
   dati strutturati verificabili senza doverli aggiornare a mano.

   Perché solo dateModified:
   - "datePublished" resta il dato già presente nei file (metadato esistente):
     la cronologia git di questo repository è spesso shallow o compattata, per
     cui la data del primo commit non coincide con quella reale di pubblicazione
     e non sarebbe una fonte affidabile. Non inventiamo date: se git non offre
     un dato attendibile, teniamo il metadato esistente.
   - "dateModified" è invece la data dell'ultimo commit sul file, che git
     riporta in modo affidabile anche su clone shallow.

   Uso:  node tools/aggiorna-date-dossier.js          (aggiorna i file)
         node tools/aggiorna-date-dossier.js --check   (esce con codice 1 se
                                                        qualcosa sarebbe cambiato)
   Requisiti: git disponibile nel PATH ed esecuzione dentro il repository. */
"use strict";
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var DIR = path.join(ROOT, "dossier");
var check = process.argv.indexOf("--check") !== -1;

function dataUltimoCommit(file) {
  var out;
  try {
    out = cp.execSync("git log -1 --format=%ad --date=short -- " + JSON.stringify(file), {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch (e) { return null; }
  return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
}

var files = fs.readdirSync(DIR).filter(function (n) { return /\.html$/i.test(n); });
var cambiati = [];

files.forEach(function (nome) {
  var p = path.join(DIR, nome);
  var testo = fs.readFileSync(p, "utf8");
  // Interviene solo se esiste già un blocco Article con dateModified.
  if (!/"@type":\s*"Article"/.test(testo)) return;
  var data = dataUltimoCommit("dossier/" + nome);
  if (!data) return; // git non attendibile: non tocchiamo nulla.

  var nuovo = testo.replace(/("dateModified":\s*")\d{4}-\d{2}-\d{2}(")/, "$1" + data + "$2");
  if (nuovo !== testo) {
    cambiati.push(nome + " → " + data);
    if (!check) fs.writeFileSync(p, nuovo);
  }
});

if (check) {
  if (cambiati.length) {
    console.error("dateModified non allineato al git in " + cambiati.length + " dossier:");
    cambiati.forEach(function (c) { console.error("  " + c); });
    process.exit(1);
  }
  console.log("dateModified dei dossier allineato all'ultimo commit git.");
} else {
  cambiati.forEach(function (c) { console.log("aggiornato " + c); });
  console.log(cambiati.length ? cambiati.length + " dossier aggiornati." : "Nessun aggiornamento necessario.");
}
