/* mediareinformati.it — motore di consultazione generico (vanilla JS, nessuna dipendenza)
   Ogni pagina-motore chiama initMotore(config) dove config definisce:
   - dati: array di record (caricato da data/*.js come variabile globale)
   - campiRicerca: campi testuali su cui opera la ricerca libera
   - filtri: [{campo, etichetta, multiplo?}] -> select popolate dai valori reali
   - rendi: funzione record -> HTML della voce di elenco
   - dettaglio: funzione record -> HTML del pannello di dettaglio (opzionale)
   - ordinamenti: [{etichetta, fn}] (opzionale)
*/
(function () {
  "use strict";
  // Rimozione definitiva delle "domande comuni" (chips che riempiono la ricerca) sotto motori/assistenti.
  (function(){try{var s=document.createElement("style");s.textContent=".suggerimenti-domande,[data-fill]{display:none!important}";(document.head||document.documentElement).appendChild(s);var rm=function(){var kill=[];var a=document.querySelectorAll(".suggerimenti-domande, #suggerimenti");for(var i=0;i<a.length;i++)kill.push(a[i]);var b=document.querySelectorAll("[data-fill]");for(var j=0;j<b.length;j++){var q=b[j].closest?b[j].closest(".qlist"):null;kill.push(q||b[j]);}for(var k=0;k<kill.length;k++){if(kill[k]&&kill[k].parentNode)kill[k].parentNode.removeChild(kill[k]);}};if(document.readyState!=="loading")rm();else document.addEventListener("DOMContentLoaded",rm);}catch(e){}})();

  // Menu di navigazione mobile/tablet: hamburger + tendina "Consultazione" (condiviso da tutte le pagine che caricano questo script).
  document.addEventListener("click", function (e) {
    var tog = e.target.closest(".navtoggle");
    if (tog) { e.preventDefault();
      var links = tog.parentNode.querySelector("nav.links");
      if (links) { var op = links.classList.toggle("open"); tog.setAttribute("aria-expanded", op ? "true" : "false"); }
      return;
    }
    var mb = e.target.closest(".menubtn");
    if (mb) { e.preventDefault();
      var sm = mb.parentNode.querySelector(".submenu");
      if (sm) { var o2 = sm.classList.toggle("open"); mb.setAttribute("aria-expanded", o2 ? "true" : "false"); }
      return;
    }
    if (!e.target.closest("header.nav")) {
      document.querySelectorAll("nav.links.open,.submenu.open").forEach(function (el) { el.classList.remove("open"); });
    }
  });

  function norma(s) {
    return (s || "").toString().toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  window.normaTesto = norma;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return (s === null || s === undefined ? "" : String(s))
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  window.esc = esc;

  window.initMotore = function (cfg) {
    var radice = document.getElementById(cfg.contenitore || "motore");
    if (!radice) return;
    if (!cfg.dati) {
      radice.innerHTML = '<div class="avviso-provvisorio"><strong>Archivio non caricato.</strong> ' +
        'Il file dei dati di questa sezione (cartella <code>data/</code>) non \u00e8 raggiungibile sul server. ' +
        'Verificare che la cartella <code>data/</code> e la cartella <code>assets/</code> siano state caricate ' +
        'accanto alle pagine HTML, conservando la struttura delle sottocartelle. ' +
        'Diagnosi completa: <a href="verifica.html">verifica.html</a>.</div>';
      return;
    }
    var dati = cfg.dati || [];
    var PASSO = cfg.passo || 50;
    var visibili = PASSO;

    /* --- strumenti: ricerca + filtri --- */
    var strumenti = el("div", { "class": "strumenti" });
    var riga = el("div", { "class": "riga" });

    var campoRicerca = el("div", { "class": "campo largo" });
    campoRicerca.appendChild(el("label", { "for": "ricerca" }, "Ricerca libera"));
    var input = el("input", { type: "search", id: "ricerca", placeholder: cfg.segnapostoRicerca || "Cerca…" });
    campoRicerca.appendChild(input);
    riga.appendChild(campoRicerca);

    var selects = [];
    (cfg.filtri || []).forEach(function (f) {
      var valori = {};
      dati.forEach(function (r) {
        var v = r[f.campo];
        if (Array.isArray(v)) v.forEach(function (x) { if (x) valori[x] = 1; });
        else if (v) valori[v] = 1;
      });
      var chiavi = Object.keys(valori).sort(f.ordina || undefined);
      if (f.decrescente) chiavi.reverse();
      var campo = el("div", { "class": "campo" });
      campo.appendChild(el("label", {}, f.etichetta));
      var sel = el("select");
      sel.appendChild(el("option", { value: "" }, "Tutti"));
      chiavi.forEach(function (k) { sel.appendChild(el("option", { value: k }, esc(k))); });
      campo.appendChild(sel);
      riga.appendChild(campo);
      selects.push({ sel: sel, campo: f.campo });
      sel.addEventListener("change", aggiorna);
    });

    var azz = el("button", { "class": "azzeramento", type: "button" }, "Azzera");
    riga.appendChild(azz);
    if (cfg.esportaWord) {
      var expw = el("button", { "class": "azzeramento", type: "button" }, "Scarica risultati in Word");
      riga.appendChild(expw);
      expw.addEventListener("click", function () {
        var testa = "<html xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'>" +
          "<style>body{font-family:Georgia,serif;font-size:11pt;line-height:1.45;color:#1b1b1f}" +
          "h1{color:#152a46;font-size:17pt}h2{color:#152a46;font-size:12pt;border-bottom:1px solid #ccc;padding-bottom:2px}" +
          "p{margin:4px 0}.m{color:#777;font-size:9pt}</style></head><body>";
        var q = input.value.trim();
        var corpo = "<h1>" + esc(cfg.titoloDoc || document.title) + "</h1>" +
          "<p class='m'>mediareinformati.it \u2014 " + correnti.length + " risultati" +
          (q ? " per \u00ab" + esc(q) + "\u00bb" : "") + " \u00b7 " + new Date().toLocaleDateString("it") + "</p><div style='border-top:1px solid #ccc;margin:12px 0'></div>";
        correnti.slice(0, 400).forEach(function (r) {
          var blocco = cfg.rendiDoc ? cfg.rendiDoc(r) : cfg.rendi(r);
          corpo += "<div>" + blocco + "</div>";
        });
        if (correnti.length > 400) corpo += "<p class='m'>\u2026 e altri " + (correnti.length - 400) + " risultati: affinare la ricerca per includerli.</p>";
        corpo += "<div style='border-top:1px solid #ccc;margin:12px 0'></div><p class='m'>Documento generato da mediareinformati.it \u00b7 estratti a fini di consultazione; i testi integrali delle opere non sono pubblicati.</p></body></html>";
        var blob = new Blob(["\ufeff" + testa + corpo], { type: "application/msword" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mediareinformati_" + (q ? norma(q).replace(/[^a-z0-9]+/g, "_").slice(0, 30) : "risultati") + ".doc";
        a.click();
      });
    }
    strumenti.appendChild(riga);
    radice.appendChild(strumenti);

    var conteggio = el("p", { "class": "conteggio", "aria-live": "polite", role: "status" });
    radice.appendChild(conteggio);
    var lista = el("ul", { "class": "risultati" });
    radice.appendChild(lista);
    var altri = el("button", { "class": "carica-altri", type: "button" }, "Mostra altri risultati");
    radice.appendChild(altri);

    var correnti = [];

    function filtra() {
      var q = norma(input.value.trim());
      var termini = q ? q.split(/\s+/) : [];
      return dati.filter(function (r) {
        for (var i = 0; i < selects.length; i++) {
          var v = selects[i].sel.value;
          if (!v) continue;
          var rv = r[selects[i].campo];
          if (Array.isArray(rv)) { if (rv.indexOf(v) === -1) return false; }
          else if (rv !== v) return false;
        }
        if (!termini.length) return true;
        var pagliaio = norma(cfg.campiRicerca.map(function (c) {
          var v = r[c]; return Array.isArray(v) ? v.join(" ") : (v || "");
        }).join("  "));
        return termini.every(function (t) { return pagliaio.indexOf(t) !== -1; });
      });
    }

    function disegna() {
      lista.innerHTML = "";
      var mostra = correnti.slice(0, visibili);
      if (!correnti.length) {
        lista.appendChild(el("li", { "class": "nessun-risultato" },
          "Nessun risultato per i criteri impostati."));
      }
      mostra.forEach(function (r, i) {
        var li = el("li", {}, cfg.rendi(r));
        if (cfg.dettaglio) {
          var btn = el("button", { "class": "apri-dettaglio", type: "button", "aria-expanded": "false" }, "Dettaglio");
          var pann = el("div", { "class": "r-dettaglio" }, cfg.dettaglio(r));
          btn.addEventListener("click", function () {
            var aperto = li.classList.toggle("aperto");
            btn.setAttribute("aria-expanded", aperto ? "true" : "false");
          });
          li.appendChild(btn);
          li.appendChild(pann);
        }
        lista.appendChild(li);
      });
      conteggio.textContent = correnti.length + " risultati su " + dati.length +
        " voci in archivio" + (correnti.length > visibili ? " — mostrati i primi " + visibili : "");
      altri.style.display = correnti.length > visibili ? "block" : "none";
    }

    function aggiorna() { visibili = PASSO; correnti = filtra(); disegna(); }

    var attesa = null;
    input.addEventListener("input", function () {
      clearTimeout(attesa); attesa = setTimeout(aggiorna, 160);
    });
    azz.addEventListener("click", function () {
      input.value = ""; selects.forEach(function (s) { s.sel.value = ""; }); aggiorna();
    });
    altri.addEventListener("click", function () { visibili += PASSO; disegna(); });

    aggiorna();
  };

  /* evidenzia la voce di menu corrente */
  document.addEventListener("DOMContentLoaded", function () {
    var qui = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("nav.principale a").forEach(function (a) {
      if (a.getAttribute("href") === qui) a.classList.add("attivo");
    });
  });
})();
