/* Smoke test del caricamento pigro (obiettivo fase 2, punto 1).
   Verifica che statistiche.html e diritto.html NON scarichino gli archivi
   data/*.js al primo caricamento, ma solo dopo la prima domanda, e che una
   risposta venga effettivamente composta dall'archivio locale.

   Richiede Playwright (facoltativo): se non è installato il test si salta
   senza fallire, così la CI senza dipendenze non viene bloccata.
   Esecuzione: node tests/test-lazyload.js */
"use strict";
var http = require("http");
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

var playwright = null;
["playwright", path.join(require("os").tmpdir(), "node_modules", "playwright")].forEach(function (m) {
  if (playwright) return;
  try { playwright = require(m); } catch (e) {}
});
if (!playwright) {
  console.log("Playwright non disponibile: smoke test del lazy-load SALTATO (non bloccante).");
  process.exit(0);
}

var TIPI = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml; charset=utf-8", ".ico": "image/x-icon" };

function servi() {
  return http.createServer(function (req, res) {
    var rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel === "/") rel = "/index.html";
    var f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.statusCode = 404; res.end("404"); return;
    }
    res.setHeader("Content-Type", TIPI[path.extname(f)] || "application/octet-stream");
    fs.createReadStream(f).pipe(res);
  });
}

function pagina(browser, base, url, cb) {
  var richieste = [];
  browser.newPage().then(function (page) {
    return page.addInitScript(function () { window.MEDIA_AI = { endpoint: "" }; })
      .then(function () {
        page.on("request", function (r) {
          var u = r.url();
          if (/\/data\/[^/]+\.js(\?|$)/.test(u) || /pako\.min\.js/.test(u)) richieste.push(u);
        });
        return page.goto(base + url, { waitUntil: "networkidle" });
      })
      .then(function () {
        var alCaricamento = richieste.slice();
        return page.fill("#domanda", "mediazione obbligatoria")
          .then(function () { return page.click("#chiedi"); })
          .then(function () { return page.waitForSelector(".risposta", { timeout: 15000 }); })
          .then(function () {
            var dopoDomanda = richieste.slice();
            return page.close().then(function () {
              cb(null, { alCaricamento: alCaricamento, dopoDomanda: dopoDomanda });
            });
          });
      })
      .catch(function (e) { page.close().then(function () { cb(e); }); });
  });
}

var errori = [];
var srv = servi();
srv.listen(0, function () {
  var base = "http://127.0.0.1:" + srv.address().port;
  playwright.chromium.launch().then(function (browser) {
    var pagine = ["/statistiche.html", "/diritto.html"];
    (function prossima(idx) {
      if (idx >= pagine.length) {
        browser.close().then(function () {
          srv.close();
          if (errori.length) {
            console.error("\nSmoke test lazy-load FALLITO (" + errori.length + "):");
            errori.forEach(function (e) { console.error("  " + e); });
            process.exit(1);
          }
          console.log("\nSmoke test lazy-load superato: archivi caricati solo dopo la domanda.");
        });
        return;
      }
      var url = pagine[idx];
      pagina(browser, base, url, function (err, res) {
        if (err) { errori.push(url + ": errore runtime — " + err.message); return prossima(idx + 1); }
        if (res.alCaricamento.length) errori.push(url + ": archivi scaricati al primo paint (" + res.alCaricamento.length + ")");
        if (!res.dopoDomanda.length) errori.push(url + ": nessun archivio scaricato dopo la domanda");
        console.log(url + " — al caricamento: " + res.alCaricamento.length + " archivi | dopo la domanda: " + res.dopoDomanda.length + " archivi + risposta OK");
        prossima(idx + 1);
      });
    })(0);
  }).catch(function (e) {
    srv.close();
    console.log("Chromium non avviabile (" + e.message + "): smoke test SALTATO (non bloccante).");
    process.exit(0);
  });
});
