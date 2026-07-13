/* mediareinformati.it — motore di consultazione
   1) Ricerca lato client sull'archivio pubblico del sito (funziona sempre).
   2) Se è configurato un endpoint IA (window.ASSISTENTE_ENDPOINT), la domanda
      viene inviata lì e la risposta composta con le fonti viene mostrata.
   Per attivare l'IA: crea un file config.js con
      window.ASSISTENTE_ENDPOINT = "https://TUO-ENDPOINT";
   e caricalo prima di questo script. Vedi GUIDA_ASSISTENTE_IA.md. */
(function () {
  "use strict";
  var EMAIL = "calcagnocarloalberto1@gmail.com";

  // --- Indice dell'archivio pubblico (domanda → risposta sintetica + pagina) ---
  var IDX = [
    {t:"Quando la mediazione è obbligatoria?", u:"diritto.html",
     a:"È condizione di procedibilità nelle materie dell'art. 5 del d.lgs. 28/2010 (riforma Cartabia, correttivo d.lgs. 216/2024): tra le altre condominio, diritti reali, divisione, successioni, patti di famiglia, locazione, comodato, affitto d'azienda, responsabilità medica, diffamazione a mezzo stampa, contratti assicurativi, bancari e finanziari, franchising, società di persone, subfornitura.",
     k:"obbligatoria obbligatorieta obbligo procedibilita condizione materie quando devo obbligatorio condominio locazione successioni medica bancari"},
    {t:"Quanto dura il procedimento di mediazione?", u:"diritto.html",
     a:"Dopo il correttivo (d.lgs. 216/2024) la durata è di sei mesi (art. 6 del d.lgs. 28/2010), prorogabile con l'accordo delle parti.",
     k:"durata dura quanto tempo mesi termine scadenza sei mesi lunghezza"},
    {t:"Cosa si rischia se non si partecipa?", u:"diritto.html",
     a:"Il giudice condanna la parte che, senza giustificato motivo, non ha partecipato al versamento di una somma pari al doppio del contributo unificato (art. 12-bis), e può trarne argomenti di prova.",
     k:"sanzione rischio non partecipa mancata partecipazione assenza doppio contributo unificato conseguenze non presentarsi"},
    {t:"Quanto costa e c'è un credito d'imposta?", u:"diritto.html",
     a:"Le indennità seguono la Tabella A del d.m. 150/2023. È previsto un credito d'imposta per le spese di mediazione e per il compenso dell'avvocato (ridotto in caso di mancato accordo); le domande si presentano sul portale del Ministero della Giustizia.",
     k:"costo costa costi indennita prezzo tariffe credito imposta spese pagare quanto pago dm 150/2023 compenso"},
    {t:"Che cos'è la mediazione demandata dal giudice?", u:"diritto.html",
     a:"È la mediazione disposta dal giudice, anche in appello, valutata la natura della causa, lo stato dell'istruzione e il comportamento delle parti (art. 5-quater d.lgs. 28/2010); il suo esperimento è condizione di procedibilità.",
     k:"demandata giudice disposta ordinata appello 5-quater tribunale delegata"},
    {t:"La mediazione è riconosciuta all'estero?", u:"diritto.html",
     a:"Nell'UE la direttiva 2008/52/CE disciplina la mediazione civile e commerciale (la Danimarca non ne è vincolata). La Convenzione di Singapore (2018, in vigore dal 12 settembre 2020) rende direttamente eseguibili all'estero gli accordi commerciali internazionali frutto di mediazione.",
     k:"estero internazionale internazionalmente ue europa direttiva 2008/52 singapore riconoscimento transfrontaliera eseguibile"},
    {t:"Cosa prevede la riforma Cartabia?", u:"diritto.html",
     a:"Il d.lgs. 149/2022, con il correttivo 216/2024, ha riformato il d.lgs. 28/2010: durata a sei mesi, mediazione telematica, incentivi fiscali, disciplina della mediazione demandata e dei rapporti con il processo.",
     k:"cartabia riforma 149/2022 216/2024 novita cambiamenti nuova legge modifiche"},
    {t:"Come funziona la mediazione negli altri Paesi?", u:"diritto.html",
     a:"La sezione Diritto e comparazione raccoglie 195 profili-Paese aggiornati al 2026, uno per ordinamento, e mette a confronto i ventisette Stati dell'Unione europea su obbligatorietà, costi ed effetti dell'accordo.",
     k:"paesi altri paese mondo comparazione francia germania spagna estero ordinamenti comparata internazionale confronto"},
    {t:"La mediazione familiare come è disciplinata?", u:"diritto.html",
     a:"La mediazione familiare è distinta da quella civile: si fonda sull'art. 473-bis.10 c.p.c., sulla legge 4/2013 e sul d.m. 151/2023; l'art. 473-bis.43 c.p.c. pone limiti al suo utilizzo in presenza di violenza.",
     k:"familiare famiglia separazione divorzio figli coppia genitori aimef 473-bis violenza"},
    {t:"L'avvocato negoziatore: deontologia, tecniche e ADR", u:"avvocato-negoziatore.html",
     a:"La sezione dedicata al Volume Secondo tratta la deontologia dell'assistenza in mediazione, le tecniche di negoziazione (interessi, BATNA, gestione dell'impasse), i modelli operativi (clausole, verbali, informative, procure) e la responsabilità dell'avvocato negli ADR.",
     k:"avvocato negoziatore negoziazione difensore deontologia clausola clausole verbale procura informativa batna interessi impasse responsabilita adr assistenza legale tecniche tavolo"},
    {t:"Storia della mediazione", u:"storia.html",
     a:"La sezione Storia raccoglie 933 voci: dalle origini mitiche mesopotamiche alla conciliazione greco-romana (aidesis, diaitetái, conciliatio), fino alle leggi dal 1770 a oggi.",
     k:"storia origini nascita antica greci romani mesopotamia conciliatore ottocento evoluzione radici"},
    {t:"Come si prepara e si conduce il primo incontro?", u:"pratica.html",
     a:"La sezione Pratica raccoglie dispense e manuali operativi per preparare e condurre il primo incontro, con le tecniche di comunicazione e 22 strumenti del tavolo; è disponibile gratis il manuale integrale (584 pp.).",
     k:"primo incontro pratica condurre preparare tecniche comunicazione strumenti tavolo manuale conduzione mediatore come si fa"},
    {t:"Quanti mediatori ci sono e quali numeri?", u:"statistiche.html",
     a:"La sezione Dati raccoglie oltre 242.000 mediatori in 103 ordinamenti, le serie DGSTAT 2011–2025, l'EU Justice Scoreboard 2026 e i dati del World Justice Project, con tabelle Excel scaricabili.",
     k:"quanti mediatori numeri dati statistiche cifre quantita dgstat scoreboard mondo registri excel"},
    {t:"L'opera «Mediazione, il diritto della pace»", u:"opera.html",
     a:"L'opera è in cinque volumi in PDF: I) Mediazione in Europa; II) L'avvocato negoziatore; III) Mediazione nel mondo (195 ordinamenti); IV) Fisiologia della comunicazione; V) Storia della mediazione e corpus normativo.",
     k:"opera volumi volume libro libri pdf scaricare trattato monografia leggere"},
    {t:"Glossario della mediazione e degli ADR", u:"glossario.html",
     a:"Il glossario spiega i termini della mediazione e degli ADR con i riferimenti normativi; è raggiungibile dalla Biblioteca.",
     k:"glossario termine termini definizione definizioni significato lessico vocabolario adr sigle"},
    {t:"Dossier, articoli e schede-Paese (Biblioteca)", u:"biblioteca.html",
     a:"Nella Biblioteca trovi i dossier tematici, gli articoli d'autore, il glossario, i profili e le banche dati dei 195 Paesi, la timeline storica e i materiali sulla comunicazione.",
     k:"dossier approfondimenti biblioteca articoli glossario timeline schede paese profili banche dati sistemi censimento background monografie"},
    {t:"Chi è l'autore del sito?", u:"progetto.html",
     a:"Carlo Alberto Calcagno, avvocato, mediatore e formatore a Genova: vicedirettore della Scuola di Alta Formazione U.N.A.M., docente e autore di quattro monografie sulla risoluzione dei conflitti.",
     k:"autore chi sei chi e calcagno avvocato genova cv curriculum contatti unam formatore"}
  ];

  function norm(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); }
  var STOP = {"che":1,"come":1,"cosa":1,"con":1,"per":1,"del":1,"della":1,"dei":1,"delle":1,"una":1,"uno":1,"gli":1,"nel":1,"nella":1,"sono":1,"sul":1,"sulla":1,"quando":1,"quanto":1,"quale":1,"quali":1,"chi":1,"non":1,"the":1};

  function search(q){
    var terms = norm(q).split(/[^a-z0-9]+/).filter(function(w){ return w.length>2 && !STOP[w]; });
    if(!terms.length) return [];
    return IDX.map(function(e){
      var nt=norm(e.t), nk=norm(e.k), na=norm(e.a), score=0;
      terms.forEach(function(w){
        if(nt.indexOf(w)>=0) score+=4;
        if(nk.indexOf(w)>=0) score+=3;
        if(na.indexOf(w)>=0) score+=1;
      });
      return {e:e, score:score};
    }).filter(function(x){ return x.score>0; })
      .sort(function(a,b){ return b.score-a.score; })
      .slice(0,5).map(function(x){ return x.e; });
  }

  function box(eng){
    var b = eng.querySelector(".engine-results");
    if(!b){ b=document.createElement("div"); b.className="engine-results"; b.style.cssText="margin-top:16px"; eng.appendChild(b); }
    return b;
  }
  function esc(s){ return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function renderResults(eng, q){
    var b = box(eng), res = search(q);
    if(!res.length){
      b.innerHTML = '<p style="color:#A93226;font-weight:700;margin:0;line-height:1.45">Nessun risultato diretto per «'+esc(q)+'». Consulta le sezioni del sito o scrivi all’Avv. Calcagno: <a href="mailto:'+EMAIL+'" style="color:inherit">'+EMAIL+'</a>.</p>';
      return;
    }
    var html = '<p style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5b574f;margin:0 0 10px">Dall’archivio del sito</p>';
    html += res.map(function(e){
      return '<a href="'+e.u+'" style="display:block;border:2px solid #141414;background:#F4F1EA;box-shadow:3px 3px 0 #141414;padding:13px 15px;margin-bottom:10px;text-decoration:none;color:#141414">'
        + '<b style="font-size:15px">'+esc(e.t)+'</b>'
        + '<span style="display:block;color:#5b574f;font-size:13.5px;line-height:1.5;margin:4px 0 6px">'+esc(e.a)+'</span>'
        + '<span style="color:#A93226;font-weight:800;font-size:13px">Approfondisci →</span></a>';
    }).join("");
    html += '<p style="font-size:12.5px;color:#5b574f;margin:6px 0 0;line-height:1.45">Ricerca nell’archivio pubblico del sito. L’assistente che compone un’unica risposta ragionata con tutte le fonti è in preparazione.</p>';
    b.innerHTML = html;
  }

  function renderAI(eng, data){
    var b = box(eng);
    var srcs = (data.sources||[]).map(function(s){
      var u = s.url||"#", t = s.title||s.url||"fonte";
      return '<li><a href="'+u+'" style="color:#A93226">'+esc(t)+'</a></li>';
    }).join("");
    b.innerHTML = '<div style="border:2px solid #141414;background:#fff;box-shadow:3px 3px 0 #141414;padding:16px">'
      + '<p style="margin:0 0 8px;line-height:1.6">'+esc(data.answer||"").replace(/\n/g,"<br>")+'</p>'
      + (srcs ? '<p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#5b574f;margin:12px 0 4px">Fonti</p><ul style="margin:0;padding-left:18px;font-size:13.5px">'+srcs+'</ul>' : '')
      + '</div><p style="font-size:12px;color:#5b574f;margin:8px 0 0">Risposta composta dall’IA sull’archivio; da verificare sempre sulle fonti citate — non è un parere professionale.</p>';
  }

  function loading(eng){
    box(eng).innerHTML = '<p style="color:#5b574f;font-weight:700;margin:0">Sto consultando l’archivio…</p>';
  }

  function submit(eng){
    var i = eng.querySelector(".searchrow input");
    var q = i && i.value.trim();
    if(!q){ box(eng).innerHTML = '<p style="color:#A93226;font-weight:700;margin:0">Scrivi prima una domanda.</p>'; return; }
    var endpoint = window.ASSISTENTE_ENDPOINT;
    if(endpoint){
      loading(eng);
      fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({question:q})})
        .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
        .then(function(d){ renderAI(eng, d); })
        .catch(function(){ renderResults(eng, q); });
    } else {
      renderResults(eng, q);
    }
  }

  document.addEventListener("click", function(e){
    var f = e.target.closest("[data-fill]");
    if(f){ e.preventDefault();
      var eng = f.closest(".engine") || document;
      var i = eng.querySelector(".searchrow input");
      if(i){ i.value = f.getAttribute("data-fill"); i.focus(); submit(eng); }
      return;
    }
    var btn = e.target.closest(".searchrow button");
    if(btn){ e.preventDefault();
      var eng2 = btn.closest(".engine") || btn.closest(".searchrow").parentNode;
      submit(eng2);
    }
  });
  document.addEventListener("keydown", function(e){
    if(e.key==="Enter" && e.target.matches && e.target.matches(".searchrow input")){
      e.preventDefault();
      var eng = e.target.closest(".engine") || e.target.closest(".searchrow").parentNode;
      submit(eng);
    }
  });
})();
