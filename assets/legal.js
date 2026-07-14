/* mediareinformati.it — banner cookie e link legali nel footer.
   Sito statico, nessuna profilazione. Ricorda la scelta in localStorage. */
(function () {
  "use strict";
  var KEY = "mri_consenso_cookie";
  function pronti(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function aggiungiLinkFooter() {
    var interno = document.querySelector("footer.sito .interno");
    if (!interno || interno.querySelector(".legale-link")) return;
    var span = document.createElement("span");
    span.className = "legale-link";
    span.innerHTML = '<a href="dossier.html" style="color:#d8d4cb">Dossier</a> &middot; ' +
                     '<a href="articoli.html" style="color:#d8d4cb">Articoli</a> &middot; ' +
                     '<a href="come-si-usa.html" style="color:#d8d4cb">Come si usa</a> &middot; ' +
                     '<a href="glossario.html" style="color:#d8d4cb">Glossario</a> &middot; ' +
                     '<a href="privacy.html" style="color:#d8d4cb">Privacy</a> &middot; ' +
                     '<a href="cookie.html" style="color:#d8d4cb">Cookie</a> &middot; ' +
                     '<a href="note-legali.html" style="color:#d8d4cb">Note legali</a>';
    interno.appendChild(span);
  }
  function mostraBanner() {
    var scelta;
    try { scelta = localStorage.getItem(KEY); } catch (e) { scelta = null; }
    if (scelta) return;
    var b = document.createElement("div");
    b.setAttribute("role", "dialog");
    b.setAttribute("aria-label", "Informativa cookie");
    b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#152a46;color:#f4f2ec;" +
      "padding:14px 18px;box-shadow:0 -2px 12px rgba(0,0,0,.25);font-family:Georgia,serif;font-size:.9rem;line-height:1.5";
    b.innerHTML =
      '<div style="max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between">' +
        '<div style="flex:1 1 420px">Questo sito &egrave; statico e usa solo <strong>cookie e archiviazione tecnici</strong> ' +
        '(nessuna profilazione, nessuna pubblicit&agrave;). Usando l&rsquo;assistente, la domanda &egrave; inviata a un ' +
        'servizio di intelligenza artificiale di terze parti. Dettagli nella <a href="cookie.html" style="color:#e9c98a">cookie policy</a> ' +
        'e nella <a href="privacy.html" style="color:#e9c98a">privacy policy</a>.</div>' +
        '<div style="flex:0 0 auto;display:flex;gap:8px">' +
          '<button type="button" id="mri-cookie-rifiuta" style="cursor:pointer;border:1px solid #b9c2d4;background:transparent;color:#f4f2ec;padding:8px 14px;border-radius:6px;font-family:inherit">Solo tecnici</button>' +
          '<button type="button" id="mri-cookie-accetta" style="cursor:pointer;border:0;background:#B08D3E;color:#fff;padding:8px 16px;border-radius:6px;font-family:inherit;font-weight:bold">Ho capito</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(b);
    function chiudi(val) {
      try { localStorage.setItem(KEY, val); } catch (e) {}
      if (b.parentNode) b.parentNode.removeChild(b);
    }
    document.getElementById("mri-cookie-accetta").addEventListener("click", function () { chiudi("accettato"); });
    document.getElementById("mri-cookie-rifiuta").addEventListener("click", function () { chiudi("solo-tecnici"); });
  }
  pronti(function () { aggiungiLinkFooter(); mostraBanner(); });
})();
