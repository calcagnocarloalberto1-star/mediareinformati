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
    strumenti.appendChild(riga);
    radice.appendChild(strumenti);

    var conteggio = el("p", { "class": "conteggio" });
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
          var btn = el("button", { "class": "apri-dettaglio", type: "button" }, "Dettaglio");
          var pann = el("div", { "class": "r-dettaglio" }, cfg.dettaglio(r));
          btn.addEventListener("click", function () { li.classList.toggle("aperto"); });
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
