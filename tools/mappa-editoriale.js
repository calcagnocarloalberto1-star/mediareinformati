/* Mappa editoriale esplicita e revisionabile dei dossier.

   È la fonte unica, curata a mano (non algoritmica), usata da
   tools/arricchisci-dossier.js per:
   - il campo "about" del JSON-LD Article di ogni dossier (temi trattati);
   - la sezione "Contenuti correlati" con link interni pertinenti.

   Nota: i dossier che hanno già una sezione redazionale "Per approfondire"
   conservano quella (curata nel corpo della pagina); per essi la voce
   "correlati" qui sotto resta come documentazione della rete editoriale e
   viene comunque verificata dai test di integrità dei link. La sezione
   "Contenuti correlati" viene inserita automaticamente solo dove manca una
   sezione di rimando (per non duplicare i link già presenti).

   Regole: link realmente pertinenti, sempre inclusi gli hub Dossier e Diritto;
   niente set identico di link su tutti i dossier oltre agli hub. */
"use strict";

// Etichette brevi e stabili per i target interni (dossier e hub).
var ETICHETTE = {
  "antiriciclaggio.html": "Antiriciclaggio in mediazione",
  "cartabia.html": "La riforma Cartabia",
  "costi.html": "Costi e incentivi fiscali",
  "demandata.html": "La mediazione demandata",
  "deontologia.html": "Deontologia del mediatore",
  "eu-scoreboard-2026.html": "EU Justice Scoreboard 2026",
  "europa.html": "La mediazione in Europa",
  "fonti-tipi-mediazione-ue.html": "Le fonti della mediazione nella UE",
  "giustizia-in-evoluzione.html": "La giustizia in evoluzione",
  "mediazione-familiare.html": "La mediazione familiare",
  "numeri.html": "I numeri della mediazione in Italia",
  "obbligatoria-mondo.html": "La mediazione obbligatoria nel mondo",
  "obbligatorieta.html": "Quando la mediazione è obbligatoria",
  "oriente.html": "Le radici orientali della mediazione",
  "primo-incontro.html": "Il primo incontro di mediazione",
  "procura-sostanziale.html": "La procura in mediazione",
  "ricerca-mondiale-mediazione.html": "La mediazione nel mondo in numeri",
  "storia-conciliazione.html": "Storia della conciliazione italiana",
  "telematica.html": "La mediazione telematica",
  "violenza.html": "Violenza domestica e mediazione",
  // Hub (percorsi relativi dalla cartella dossier/)
  "../diritto.html": "Diritto e comparazione",
  "../dossier.html": "Tutti i dossier",
  "../statistiche.html": "Dati e statistiche",
  "../storia.html": "Storia della mediazione"
};

// about: temi del dossier. correlati: link interni pertinenti (con hub).
var MAPPA = {
  "antiriciclaggio.html": {
    about: ["Antiriciclaggio", "Obblighi del mediatore", "Mediazione civile"],
    correlati: ["deontologia.html", "costi.html", "primo-incontro.html", "../diritto.html", "../dossier.html"]
  },
  "cartabia.html": {
    about: ["Riforma Cartabia", "D.lgs. 149/2022", "Mediazione civile"],
    correlati: ["obbligatorieta.html", "demandata.html", "telematica.html", "costi.html", "../diritto.html"]
  },
  "costi.html": {
    about: ["Costi della mediazione", "Indennità", "Credito d'imposta"],
    correlati: ["cartabia.html", "obbligatorieta.html", "demandata.html", "../statistiche.html", "../diritto.html"]
  },
  "demandata.html": {
    about: ["Mediazione demandata", "Art. 5-quater d.lgs. 28/2010", "Processo civile"],
    correlati: ["cartabia.html", "obbligatorieta.html", "primo-incontro.html", "../diritto.html", "../dossier.html"]
  },
  "deontologia.html": {
    about: ["Deontologia", "Imparzialità del mediatore", "Riservatezza"],
    correlati: ["antiriciclaggio.html", "primo-incontro.html", "violenza.html", "../diritto.html", "../dossier.html"]
  },
  "eu-scoreboard-2026.html": {
    about: ["EU Justice Scoreboard", "Sistemi giudiziari UE", "Mediazione in Europa"],
    correlati: ["europa.html", "fonti-tipi-mediazione-ue.html", "numeri.html", "../statistiche.html", "../diritto.html"]
  },
  "europa.html": {
    about: ["Direttiva 2008/52/CE", "Mediazione in Europa", "Diritto comparato"],
    correlati: ["fonti-tipi-mediazione-ue.html", "eu-scoreboard-2026.html", "obbligatoria-mondo.html", "../diritto.html", "../dossier.html"]
  },
  "fonti-tipi-mediazione-ue.html": {
    about: ["Fonti della mediazione", "Unione europea", "Diritto comparato"],
    correlati: ["europa.html", "eu-scoreboard-2026.html", "obbligatoria-mondo.html", "../diritto.html", "../dossier.html"]
  },
  "giustizia-in-evoluzione.html": {
    about: ["Riforma Cartabia", "Giustizia consensuale", "Negoziazione assistita"],
    correlati: ["cartabia.html", "obbligatorieta.html", "costi.html", "../diritto.html", "../dossier.html"]
  },
  "mediazione-familiare.html": {
    about: ["Mediazione familiare", "Diritto di famiglia", "Modelli europei"],
    correlati: ["violenza.html", "primo-incontro.html", "europa.html", "../diritto.html", "../dossier.html"]
  },
  "numeri.html": {
    about: ["Statistiche della mediazione", "DGSTAT", "Mediazione in Italia"],
    correlati: ["ricerca-mondiale-mediazione.html", "eu-scoreboard-2026.html", "costi.html", "../statistiche.html", "../diritto.html"]
  },
  "obbligatoria-mondo.html": {
    about: ["Mediazione obbligatoria", "Diritto comparato", "Mediazione nel mondo"],
    correlati: ["obbligatorieta.html", "europa.html", "ricerca-mondiale-mediazione.html", "../diritto.html", "../dossier.html"]
  },
  "obbligatorieta.html": {
    about: ["Condizione di procedibilità", "Materie obbligatorie", "Mediazione civile"],
    correlati: ["cartabia.html", "demandata.html", "costi.html", "primo-incontro.html", "../diritto.html"]
  },
  "oriente.html": {
    about: ["Storia della mediazione", "Cina, India, Giappone", "Radici culturali"],
    correlati: ["storia-conciliazione.html", "obbligatoria-mondo.html", "../storia.html", "../dossier.html"]
  },
  "primo-incontro.html": {
    about: ["Primo incontro", "Procedura di mediazione", "Effettività"],
    correlati: ["obbligatorieta.html", "demandata.html", "deontologia.html", "telematica.html", "../diritto.html"]
  },
  "procura-sostanziale.html": {
    about: ["Procura in mediazione", "Procura sostanziale", "Rappresentanza"],
    correlati: ["primo-incontro.html", "demandata.html", "costi.html", "../diritto.html", "../dossier.html"]
  },
  "ricerca-mondiale-mediazione.html": {
    about: ["Mediazione nel mondo", "Statistiche comparate", "Mediatori"],
    correlati: ["numeri.html", "obbligatoria-mondo.html", "eu-scoreboard-2026.html", "../statistiche.html", "../diritto.html"]
  },
  "storia-conciliazione.html": {
    about: ["Storia della conciliazione", "Diritto italiano", "D.lgs. 28/2010"],
    correlati: ["oriente.html", "europa.html", "../storia.html", "../dossier.html"]
  },
  "telematica.html": {
    about: ["Mediazione telematica", "Art. 8-bis d.lgs. 28/2010", "Firma digitale"],
    correlati: ["cartabia.html", "primo-incontro.html", "demandata.html", "../diritto.html", "../dossier.html"]
  },
  "violenza.html": {
    about: ["Violenza domestica", "Mediazione familiare", "Tutela della persona"],
    correlati: ["mediazione-familiare.html", "deontologia.html", "primo-incontro.html", "../diritto.html", "../dossier.html"]
  }
};

module.exports = { ETICHETTE: ETICHETTE, MAPPA: MAPPA };
