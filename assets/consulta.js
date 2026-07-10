/* consulta.js — modulo comune: domanda -> contributo AI -> Word, con apparato fonti.
   Uso: initConsulta({ dati: fn->[{titolo, meta, estratto, testo, url?}], ruolo, fonteTitolo,
                       suggerimenti:[], placeholder, sinonimi:[[regex,[term]]], italiaPrima:bool, nomeFile }) */
(function () {
  "use strict";
  var STOP = "il lo la i gli le un una uno di a da in con su per tra fra e o ma che chi cui non come dove quando quanto quale quali cosa cos è e' della delle dei degli del al alla alle ai agli sul sulla sulle nei nelle nel si mi ti ci vi ne se più meno molto poco tutto tutti ogni questo questa questi queste quello quella essere avere fare può puo sono viene vengono stato stata qual mediante circa anche ancora poi già gia verso presso senza sotto sopra hanno ruolo modo era erano quali funziona prevede riguarda".split(" ");
  var ESTERO = /kosov|giappon|cines|\bcina\b|russ|spagn|svizzer|frances|francia|prussia|danes|danimarc|portog|austri|german|tedesc|inghilterr|inglese|regno unito|stati uniti|\busa\b|slovacc|sloven|romania|rumen|bulgar|polon|ungher|olanda|belgio|malta|cipro|albania|croaz|grecia|irland|lituan|letton|eston|finland|svez|lussemburg|malesia|vietnam|yemen|india|argentin|brasil|canad|marocc|turc|ucrain|australi|israel|onu|uncitral/;

  window.initConsulta = function (cfg) {
    var ultima = null;

    function termini(q) {
      var n = normaTesto(q).replace(/[?!.,;:'"()]/g, " ");
      var base = n.split(/\s+/).filter(function (t) { return t.length > 2 && STOP.indexOf(t) === -1; });
      var extra = [];
      (cfg.sinonimi || []).forEach(function (s) { if (s[0].test(n)) extra = extra.concat(s[1].map(normaTesto)); });
      return { base: base, extra: extra };
    }
    function punteggio(testo, ts) {
      var n = normaTesto(testo || ""), s = 0;
      ts.base.forEach(function (t) {
        var i = -1, c = 0;
        while ((i = n.indexOf(t, i + 1)) !== -1 && c < 5) { s += 1; c++; }
        if (c === 0 && t.length > 5 && n.indexOf(t.slice(0, 5)) !== -1) s += 0.4;
      });
      ts.extra.forEach(function (t) { if (n.indexOf(t) !== -1) s += 1.5; });
      return s;
    }
    function cerca(q) {
      var ts = termini(q);
      if (!ts.base.length && !ts.extra.length) return [];
      var nq = normaTesto(q);
      var base = cfg.dati();
      if (cfg.italiaPrima && !(ESTERO.test(nq) || /orient|stranier|estero|europe|mondo|comparat|internazional/.test(nq))) {
        base = base.filter(function (r) {
          var chiave = normaTesto(r.titolo + " " + (r.meta || ""));
          return !(ESTERO.test(chiave) && chiave.indexOf("itali") === -1);
        });
      }
      var ordinati = base.map(function (r) {
        var s = punteggio(r.titolo, ts) * 2.4 + punteggio(r.meta, ts) * 1.1 + punteggio(r.testo || r.estratto, ts) * 0.9;
        return { r: r, s: s };
      }).filter(function (x) { return x.s >= 1.5; })
        .sort(function (a, b) { return b.s - a.s; });
      var visti = {}, out = [];
      ordinati.forEach(function (x) {
        var k = normaTesto(x.r.titolo).replace(/\(\d+\)|copia|\bdef\b/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
        if (!visti[k]) { visti[k] = 1; out.push(x); }
      });
      return out.slice(0, cfg.massimo || 14);
    }

    function mdPulito(t) {
      function bold(s){ return s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"); }
      function celle(s){ return s.trim().replace(/^\||\|$/g, "").split("|").map(function (c){ return bold(c.trim()); }); }
      var righe = esc(t).split(/\r?\n/), h = "", inUl = false, i;
      for (i = 0; i < righe.length; i++) {
        var r = righe[i];
        // tabella markdown: riga con | seguita da riga separatrice tipo |---|---|
        if (/\|/.test(r) && i + 1 < righe.length && /-/.test(righe[i + 1]) && /^[\s|:\-]+$/.test(righe[i + 1])) {
          if (inUl) { h += "</ul>"; inUl = false; }
          var intest = celle(r); i += 2; var corpo = [];
          while (i < righe.length && /\|/.test(righe[i]) && righe[i].trim()) { corpo.push(celle(righe[i])); i++; }
          i--;
          h += "<table class='tab-contributo'><thead><tr>";
          intest.forEach(function (c){ h += "<th>" + c + "</th>"; });
          h += "</tr></thead><tbody>";
          corpo.forEach(function (row){ h += "<tr>"; row.forEach(function (c){ h += "<td>" + c + "</td>"; }); h += "</tr>"; });
          h += "</tbody></table>";
          continue;
        }
        r = bold(r);
        if (/^\s*[-*•]\s+/.test(r)) {
          if (!inUl) { h += "<ul>"; inUl = true; }
          h += "<li>" + r.replace(/^\s*[-*•]\s+/, "") + "</li>";
        } else {
          if (inUl) { h += "</ul>"; inUl = false; }
          if (/^\s*#{2,4}\s+/.test(r)) h += "<h4>" + r.replace(/^\s*#{2,4}\s+/, "") + "</h4>";
          else if (r.trim()) h += "<p>" + r + "</p>";
        }
      }
      if (inUl) h += "</ul>";
      return h;
    }

    function fontiHtml(fonti) {
      // Solo fonti pubblicamente consultabili (link http). Niente riferimenti interni.
      var pub = (fonti || []).filter(function (x) { return x.r.url && /^https?:\/\//i.test(x.r.url); });
      if (!pub.length) return "";
      var h = "<details open><summary class='fonti-titolo'>Fonti consultabili (" + pub.length + ")</summary><ul>";
      pub.forEach(function (x) {
        h += "<li><a href='" + esc(x.r.url) + "' target='_blank' rel='noopener'>" + esc(x.r.titolo) + "</a>" +
          (x.r.meta ? " <span class='cit'>(" + esc(x.r.meta) + ")</span>" : "") + "</li>";
      });
      return h + "</ul></details>";
    }

    function componi(q) {
      var stato = document.getElementById("stato");
      var cont = document.getElementById("contenitore-risposta");
      var fonti = cerca(q);
      if (!fonti.length) { stato.textContent = "Nessun contenuto corrisponde alla domanda: prova a riformularla."; cont.innerHTML = ""; return; }
      stato.textContent = "";
      ultima = { domanda: q, fonti: fonti, ai: "" };
      cont.innerHTML = "<div class='risposta'>" +
        "<h3 class='titolo-risposta'>" + esc(q) + "</h3>" +
        "<div id='blocco-ai'><p class='cit'>Sto componendo il contributo…</p></div>" +
        "<div id='blocco-fonti'>" + fontiHtml(fonti) + "</div>" +
        "<div class='barra-export'><button class='bottone-secondario' id='ex-doc'>Scarica il contributo in Word</button></div>" +
        "</div>";
      document.getElementById("ex-doc").addEventListener("click", esportaDoc);

      var bAI = document.getElementById("blocco-ai");
      if (!(window.puter && puter.ai && puter.ai.chat)) {
        bAI.innerHTML = "<p class='cit'>Composizione AI non disponibile: di seguito i materiali pertinenti.</p>";
        return;
      }
      var materiali = fonti.map(function (x) {
        return "[" + x.r.titolo + (x.r.meta ? " — " + x.r.meta : "") + "]\n" + String(x.r.testo || x.r.estratto || "").slice(0, 2200);
      }).join("\n\n");
      var prompt = "Sei l'assistente di mediareinformati.it, piattaforma italiana di consultazione sulla mediazione. " + (cfg.ruolo || "") +
        " Scrivi in italiano, in prosa da saggio didattico per mediatori, avvocati e formatori.\nREGISTRO LINGUISTICO OBBLIGATORIO: usa un italiano impeccabile, scorrevole e formale, con grammatica, concordanze verbali, preposizioni, punteggiatura e sintassi corrette e con la terminologia giuridica italiana propria della materia; evita anglicismi, calchi dall'inglese, costruzioni ambigue, ripetizioni e refusi; scrivi come un giurista italiano di madrelingua e rileggi mentalmente il testo prima di consegnarlo. " +
        "DOMANDA: " + q + "\n\nMATERIALI DELL'ARCHIVIO DEL SITO (base documentale riservata):\n" + materiali +
        "\n\nREGOLE: 1) componi una RICOSTRUZIONE AUTONOMA, continua e armonica (600-1000 parole), che risponda esattamente alla domanda, NON un elenco di frammenti; 2) NON menzionare mai il curatore dell'archivio ne' le sue opere: scrivi come trattazione scientifica autonoma; 3) VALORIZZA e cita tra parentesi le fonti primarie ed esterne richiamate nei materiali (leggi con estremi, codici storici, pronunce, documenti istituzionali, autori storici); 4) scarta in silenzio i materiali non pertinenti; se quelli pertinenti sono pochi, dillo e limita la trattazione a quanto documentato; 5) non inventare estremi normativi o giurisprudenziali; 5-bis) PRIORITÀ ALLA VIGENZA: se un materiale riporta un 'AGGIORNAMENTO AL 2026' o comunque una data più recente, quello è lo stato VIGENTE e prevale sulle versioni anteriori (leggi del 2007-2012, direttiva 2008/52/CE, testi tradotti storici); enuncia per prima la regola attuale con la sua data e usa il resto come contesto storico, senza presentarlo come diritto vigente e senza ricorrere a tue conoscenze pregresse eventualmente superate; 6) rielabora sempre: nessun passo letterale oltre 40 parole; niente testi integrali; 7) chiudi con 2-3 spunti operativi o formativi; 8) NON fare MAI riferimento all'archivio, ai materiali, al manuale, alle schede, agli schemi o alle 'fonti fornite': scrivi come trattazione autonoma e cita soltanto le fonti primarie pubbliche col loro nome (leggi con estremi, pronunce, documenti istituzionali).\n" +
        "Struttura in markdown: ## Inquadramento, ## Sviluppo (più paragrafi collegati), ## Punti essenziali, ## Per la pratica e la formazione.";
      Promise.resolve(puter.ai.chat(prompt)).then(function (r) {
        var t = (r && r.message && r.message.content) ? r.message.content : (typeof r === "string" ? r : "");
        if (t) { ultima.ai = t; bAI.innerHTML = "<h4>Contributo (da verificare sulle fonti)</h4>" + mdPulito(t); }
        else bAI.innerHTML = "<p class='cit'>Composizione AI non riuscita: di seguito i materiali pertinenti.</p>";
      }).catch(function () {
        bAI.innerHTML = "<p class='cit'>Composizione AI non disponibile in questo momento: di seguito i materiali pertinenti.</p>";
      });
    }

    function esportaDoc() {
      if (!ultima) return;
      var corpo = document.getElementById("blocco-ai").innerHTML + document.getElementById("blocco-fonti").innerHTML;
      var html = "<html xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'>" +
        "<style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.5}h1{color:#9c2b1f;font-size:18pt}h4{color:#111;border-bottom:1px solid #ccc}.cit{color:#777;font-size:10pt}summary{font-weight:bold}</style></head><body>" +
        "<h1>" + esc(ultima.domanda) + "</h1><p><em>mediareinformati.it — " + (cfg.nomeSezione || "contributo") + ", " + new Date().toLocaleDateString("it") + "</em></p>" +
        corpo + "<div style='border-top:1px solid #ccc;margin:12px 0'></div><p style='font-size:9pt;color:#777'>Contributo elaborato da mediareinformati.it; verificare sempre le fonti primarie citate. Ha finalità informative e divulgative: non costituisce né sostituisce un parere legale, psicologico, medico o terapeutico, né consulenza professionale personalizzata, e non instaura alcun rapporto professionale. Per ogni decisione rivolgersi a un professionista qualificato. L'autore e il sito non assumono responsabilità per usi difformi.</p></body></html>";
      var blob = new Blob(["﻿" + html], { type: "application/msword" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (cfg.nomeFile || "contributo") + "_" + normaTesto(ultima.domanda).replace(/[^a-z0-9]+/g, "_").slice(0, 40) + ".doc";
      a.click();
    }

    document.getElementById("chiedi").addEventListener("click", function () {
      var q = document.getElementById("domanda").value.trim();
      if (q) componi(q);
    });
    document.getElementById("domanda").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var q = this.value.trim(); if (q) componi(q); }
    });
    document.getElementById("suggerimenti").addEventListener("click", function (e) {
      if (e.target.tagName === "BUTTON") { document.getElementById("domanda").value = e.target.textContent; componi(e.target.textContent); }
    });
  };
})();
