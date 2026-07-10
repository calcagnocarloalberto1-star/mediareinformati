/* strumenti-bridge.js — barra di ritorno a mediareinformati + invio all'assistente */
(function(){
  if(window.__strumentiBridge) return; window.__strumentiBridge=true;
  function raccogli(){
    try{ if(window.OlismoProfilo && OlismoProfilo.costruisciPromptIntegrato){ var p=OlismoProfilo.costruisciPromptIntegrato(); if(p) return p; } }catch(e){}
    var ids=['cmResultBody','empResultBody','aiResultBody','chatMessages','chat-messages','chatArea'];
    for(var i=0;i<ids.length;i++){ var el=document.getElementById(ids[i]); if(el && el.offsetParent!==null){ var tx=(el.innerText||'').trim(); if(tx.length>40) return 'Risultato dallo strumento "'+document.title+'":\n\n'+tx.slice(0,7000); } }
    var m=document.querySelector('main')||document.body; var t=(m.innerText||'').trim(); return t.length>60?('Contenuto dello strumento "'+document.title+'":\n\n'+t.slice(0,4000)):'';
  }
  function invia(){ var p=raccogli(); if(!p){ alert('Compila prima lo strumento per generare un risultato da inviare all\'assistente.'); return; } try{ sessionStorage.setItem('olismo_prompt_integrato', p); }catch(e){} location.href='/assistente.html?profilo=integrato'; }
  function bar(){
    var b=document.createElement('div');
    b.setAttribute('style','position:relative;z-index:99999;display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between;background:#7a1f2b;color:#fff;padding:8px 16px;font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px');
    b.innerHTML='<span style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">'
      +'<a href="/pratica.html" style="color:#fff;text-decoration:none;font-weight:700">← mediareinformati.it · Pratica</a>'
      +'<a href="/pratica-strumenti.html" style="color:#ffd9b0;text-decoration:none">Tutti gli strumenti</a></span>'
      +'<button id="__inviaAssist" style="background:#fff;color:#7a1f2b;border:0;border-radius:20px;padding:7px 16px;font-weight:700;cursor:pointer">🤖 Invia all\'assistente</button>';
    document.body.insertBefore(b, document.body.firstChild);
    document.getElementById('__inviaAssist').addEventListener('click', invia);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bar); else bar();
})();