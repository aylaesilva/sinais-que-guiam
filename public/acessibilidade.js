/* Sinais que Guiam - módulo de acessibilidade
   Barra com: aumentar/diminuir fonte, alto contraste, ler página e comandos de voz.
   Basta incluir em cada página: <script src="acessibilidade.js"></script> */
(function () {
  'use strict';

  var KEY_FONTE = 'sqg_fonte';
  var KEY_CONTRASTE = 'sqg_contraste';

  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var fonte = parseInt(ler(KEY_FONTE) || '100', 10);
  var contraste = ler(KEY_CONTRASTE) === '1';
  var ouvindo = false;
  var reconhecimento = null;

  // ---------- Estilos ----------
  var css = document.createElement('style');
  css.textContent =
    '.sqg-barra{position:fixed;right:12px;bottom:12px;z-index:99999;display:flex;flex-wrap:wrap;gap:6px;' +
    'background:#fff;border:2px solid #000;border-radius:10px;padding:8px;max-width:340px;font-family:Arial,sans-serif}' +
    '.sqg-barra button{min-width:44px;min-height:44px;font-size:16px;font-weight:bold;cursor:pointer;' +
    'background:#fff;color:#000;border:2px solid #000;border-radius:8px;padding:6px 10px}' +
    '.sqg-barra button[aria-pressed="true"]{background:#000;color:#fff}' +
    '.sqg-barra button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:4px solid #f5a500;outline-offset:2px}' +
    '.sqg-status{flex-basis:100%;font-size:14px;color:#000;min-height:18px}' +
    'body.sqg-contraste,body.sqg-contraste *:not(.sqg-barra):not(.sqg-barra *){background-color:#000!important;color:#fff!important;border-color:#fff!important}' +
    'body.sqg-contraste a{color:#ff0!important;text-decoration:underline!important}';
  document.head.appendChild(css);

  // ---------- Barra ----------
  var barra = document.createElement('div');
  barra.className = 'sqg-barra';
  barra.setAttribute('role', 'region');
  barra.setAttribute('aria-label', 'Recursos de acessibilidade');

  function botao(texto, rotulo, acao, alternavel) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = texto;
    b.setAttribute('aria-label', rotulo);
    if (alternavel) b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', acao);
    barra.appendChild(b);
    return b;
  }

  var status = document.createElement('div');
  status.className = 'sqg-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  function avisar(msg, falarTambem) {
    status.textContent = msg;
    if (falarTambem) falar(msg);
  }

  // ---------- Voz (síntese) ----------
  function falar(texto) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    window.speechSynthesis.speak(u);
  }

  function lerPagina() {
    var clone = document.body.cloneNode(true);
    var b = clone.querySelector('.sqg-barra');
    if (b) b.remove();
    var area = clone.querySelector('main') || clone;
    falar(area.innerText || area.textContent || 'Página sem texto.');
  }

  // ---------- Fonte e contraste ----------
  function aplicarFonte() {
    document.documentElement.style.fontSize = fonte + '%';
    gravar(KEY_FONTE, String(fonte));
  }
  function mudarFonte(delta) {
    fonte = Math.min(200, Math.max(80, fonte + delta));
    aplicarFonte();
    avisar('Tamanho do texto: ' + fonte + '%');
  }
  function aplicarContraste() {
    document.body.classList.toggle('sqg-contraste', contraste);
    btnContraste.setAttribute('aria-pressed', String(contraste));
    gravar(KEY_CONTRASTE, contraste ? '1' : '0');
  }
  function alternarContraste() {
    contraste = !contraste;
    aplicarContraste();
    avisar(contraste ? 'Alto contraste ativado' : 'Alto contraste desativado');
  }

  // ---------- Comandos de voz ----------
  function normalizar(t) {
    return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function irPara(alvo) {
    var links = document.querySelectorAll('a[href], button');
    for (var i = 0; i < links.length; i++) {
      if (barra.contains(links[i])) continue;
      var txt = normalizar(links[i].textContent || links[i].getAttribute('aria-label') || '');
      if (txt && (txt.indexOf(alvo) !== -1 || alvo.indexOf(txt) !== -1)) {
        avisar('Abrindo ' + alvo, true);
        links[i].click();
        return;
      }
    }
    avisar('Não encontrei ' + alvo + ' nesta página.', true);
  }

  function comando(frase) {
    var t = normalizar(frase);
    var m = t.match(/^(ir para|ir|abrir|abra|va para)\s+(.+)$/);
    if (m) return irPara(m[2]);
    if (t.indexOf('aumentar') !== -1) return mudarFonte(10);
    if (t.indexOf('diminuir') !== -1) return mudarFonte(-10);
    if (t.indexOf('contraste') !== -1) return alternarContraste();
    if (t.indexOf('ler') === 0 || t.indexOf('leia') === 0) return lerPagina();
    if (t.indexOf('parar') !== -1 || t.indexOf('silencio') !== -1) return window.speechSynthesis.cancel();
    if (t.indexOf('voltar') !== -1) return window.history.back();
    if (t.indexOf('descer') !== -1 || t.indexOf('baixo') !== -1) return window.scrollBy(0, 400);
    if (t.indexOf('subir') !== -1 || t.indexOf('cima') !== -1) return window.scrollBy(0, -400);
    if (t.indexOf('ajuda') !== -1) {
      return avisar('Comandos: ir para e o nome do botão, ler página, aumentar letra, diminuir letra, contraste, descer, subir, voltar, parar.', true);
    }
    avisar('Não entendi: ' + frase, true);
  }

  function iniciarVoz() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { avisar('Seu navegador não suporta comandos de voz. Use o Chrome.', true); return false; }
    reconhecimento = new SR();
    reconhecimento.lang = 'pt-BR';
    reconhecimento.continuous = false;
    reconhecimento.onresult = function (e) {
      comando(e.results[e.results.length - 1][0].transcript);
    };
    reconhecimento.onend = function () { if (ouvindo) { try { reconhecimento.start(); } catch (e) {} } };
    reconhecimento.onerror = function (e) {
      if (e.error === 'not-allowed') { ouvindo = false; btnVoz.setAttribute('aria-pressed', 'false'); avisar('Permita o uso do microfone.', true); }
    };
    reconhecimento.start();
    return true;
  }

  function alternarVoz() {
    if (ouvindo) {
      ouvindo = false;
      if (reconhecimento) reconhecimento.stop();
      btnVoz.setAttribute('aria-pressed', 'false');
      avisar('Comandos de voz desativados');
      return;
    }
    ouvindo = iniciarVoz();
    btnVoz.setAttribute('aria-pressed', String(ouvindo));
    if (ouvindo) avisar('Ouvindo. Diga "ajuda" para ver os comandos.');
  }

  // ---------- Montagem ----------
  botao('A+', 'Aumentar tamanho do texto', function () { mudarFonte(10); });
  botao('A-', 'Diminuir tamanho do texto', function () { mudarFonte(-10); });
  var btnContraste = botao('Contraste', 'Alternar alto contraste', alternarContraste, true);
  botao('Ler', 'Ler a página em voz alta', lerPagina);
  var btnVoz = botao('Voz', 'Ativar ou desativar comandos de voz', alternarVoz, true);
  barra.appendChild(status);

  function iniciar() {
    document.body.appendChild(barra);
    aplicarFonte();
    aplicarContraste();
  }
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
})();