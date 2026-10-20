// =====================================================
// COMANDOS DE VOZ (Web Speech API)
// Depende do script.js: este arquivo precisa ser carregado DEPOIS dele.
// =====================================================
(function () {
  const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;

  const MENSAGENS_ERRO = {
    'not-allowed': 'Permita o uso do microfone no navegador para usar comandos de voz.',
    'service-not-allowed': 'Permita o uso do microfone no navegador para usar comandos de voz.',
    'no-speech': 'Não ouvi nada. Toque no microfone e tente de novo.',
    'audio-capture': 'Não encontrei um microfone neste aparelho.',
    'network': 'O reconhecimento de voz precisa de internet.',
    padrao: 'Não consegui entender. Toque no microfone e tente de novo.',
  };

  // Páginas que o usuário pode abrir por voz
  const ROTAS = [
    { nomes: ['favoritos', 'salvos'], pagina: 'favoritos.html', fala: 'Abrindo seus favoritos.' },
    { nomes: ['historico'], pagina: 'historico.html', fala: 'Abrindo o histórico.' },
    { nomes: ['ajuda', 'socorro', 'chamar bibliotecario', 'preciso de ajuda'], pagina: 'ajuda.html', fala: 'Abrindo a ajuda.' },
    { nomes: ['perfil', 'minha conta'], pagina: 'perfil.html', fala: 'Abrindo o perfil.' },
    { nomes: ['configuracoes', 'configuracao', 'ajustes'], pagina: 'configuracoes.html', fala: 'Abrindo as configurações.' },
    { nomes: ['escanear', 'escanear qr', 'qr', 'qr code', 'ler qr code'], pagina: 'qrcode.html', fala: 'Abrindo o leitor de QR Code.' },
    { nomes: ['inicio', 'home', 'pagina inicial'], pagina: 'home.html', fala: 'Voltando ao início.' },
  ];

  // "buscar redes de computadores", "procure livros sobre logística"...
  const REGEX_BUSCA = /^(?:buscar|busque|procurar|procure|pesquisar|pesquise)(?:\s+(?:o\s+|um\s+)?(?:livros?|obras?))?(?:\s+(?:sobre|de|do|da|por|com))?\s*(.*)$/;

  // ---------- Utilidades ----------
  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,!?;:]/g, '')
      .trim();
  }

  function limpar(texto) {
    return String(texto || '').toLowerCase().trim().replace(/[.!?]+$/, '');
  }

  function preferencias() {
    return typeof carregarPreferencias === 'function'
      ? carregarPreferencias()
      : { vibracao: false, velocidadeVoz: '1.0x' };
  }

  function vibrar(padrao) {
    if (preferencias().vibracao && navigator.vibrate) navigator.vibrate(padrao);
  }

  // Fala um texto e avisa quando terminar (para não gravar a própria voz do app)
  function falarEDepois(texto, aoTerminar) {
    let terminou = false;
    const terminar = () => {
      if (terminou) return;
      terminou = true;
      if (aoTerminar) aoTerminar();
    };

    if (!('speechSynthesis' in window)) {
      terminar();
      return;
    }
    speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = parseFloat(preferencias().velocidadeVoz) || 1;
    fala.onend = terminar;
    fala.onerror = terminar;
    speechSynthesis.speak(fala);
    setTimeout(terminar, 6000); // segurança: se o navegador não avisar que a fala acabou
  }

  // Aviso visual (a voz do app já fala a mesma mensagem, por isso fica escondido do leitor de tela)
  const aviso = document.createElement('div');
  aviso.className = 'status-voz';
  aviso.setAttribute('aria-hidden', 'true');
  document.body.appendChild(aviso);
  let temporizadorAviso;

  function mostrarAviso(texto, duracao) {
    aviso.textContent = texto;
    clearTimeout(temporizadorAviso);
    if (texto && duracao) temporizadorAviso = setTimeout(() => { aviso.textContent = ''; }, duracao);
  }

  // ---------- Escutar ----------
  let estado = 'parado'; // 'parado' | 'preparando' | 'ouvindo'
  let reconhecimentoAtual = null;

  function ouvir(botao, aoReconhecer) {
    if (!Reconhecimento) {
      const msg = 'Este navegador não suporta comandos de voz. Use o Chrome ou o Edge.';
      mostrarAviso(msg, 6000);
      falarEDepois(msg);
      return;
    }

    if (estado === 'preparando') return;
    if (estado === 'ouvindo') {
      reconhecimentoAtual.abort(); // segundo toque cancela
      return;
    }

    estado = 'preparando';
    falarEDepois('Pode falar.', () => {
      const rec = new Reconhecimento();
      reconhecimentoAtual = rec;
      rec.lang = 'pt-BR';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let respondeu = false;

      rec.onstart = () => {
        estado = 'ouvindo';
        botao.classList.add('ouvindo');
        botao.setAttribute('aria-pressed', 'true');
        mostrarAviso('Ouvindo… fale agora', 0);
        vibrar(80);
      };

      rec.onresult = (evento) => {
        respondeu = true;
        const texto = evento.results[0][0].transcript;
        mostrarAviso('Você disse: “' + texto + '”', 4000);
        aoReconhecer(texto);
      };

      rec.onerror = (evento) => {
        if (evento.error === 'aborted') return;
        respondeu = true;
        const msg = MENSAGENS_ERRO[evento.error] || MENSAGENS_ERRO.padrao;
        mostrarAviso(msg, 6000);
        falarEDepois(msg);
        vibrar([60, 40, 60]);
      };

      rec.onend = () => {
        estado = 'parado';
        reconhecimentoAtual = null;
        botao.classList.remove('ouvindo');
        botao.setAttribute('aria-pressed', 'false');
        if (!respondeu) mostrarAviso('', 0);
      };

      try {
        rec.start();
      } catch (erro) {
        estado = 'parado';
        reconhecimentoAtual = null;
      }
    });
  }

  // ---------- O que fazer com o que foi dito ----------
  function irPara(pagina, fala) {
    falarEDepois(fala, () => { window.location.href = pagina; });
  }

  function irParaBusca(termo) {
    irPara('busca.html?q=' + encodeURIComponent(termo), 'Buscando ' + termo + '.');
  }

  function acharRota(original) {
    const sem = normalizar(original)
      .replace(/^(?:(?:abrir|abra|ir para|ir pra|va para|me leve para|ver|mostrar|mostre|quero ver|quero)\s+)?(?:(?:o|a|os|as|meu|meus|minha|minhas)\s+)?/, '');
    return ROTAS.find((rota) => rota.nomes.includes(sem)) || null;
  }

  // Microfone da Home: abre uma página ou faz uma busca
  function tratarHome(texto) {
    const original = limpar(texto);
    const busca = original.match(REGEX_BUSCA);
    if (busca) {
      const termo = busca[1].trim();
      if (termo) irParaBusca(termo);
      else irPara('busca.html', 'Abrindo a busca.');
      return;
    }
    const rota = acharRota(original);
    if (rota) irPara(rota.pagina, rota.fala);
    else irParaBusca(original); // qualquer outra frase vira uma busca
  }

  // Tela de entrada: só entende "entrar"
  function tratarEntrada(texto) {
    if (/\b(entrar|continuar|comecar|iniciar|login)\b/.test(normalizar(texto))) {
      irPara('login.html', 'Abrindo o login.');
    } else {
      falarEDepois('Não entendi. Diga entrar para continuar.');
    }
  }

  // ---------- Busca por voz (tela Busca) ----------
  function resumoDosResultados(termo) {
    const cards = Array.from(document.querySelectorAll('#lista-resultados .card-livro'));
    if (cards.length === 0) return 'Nenhum livro encontrado para ' + termo + '.';

    const itens = cards.slice(0, 3).map((card) => {
      const titulo = card.querySelector('.titulo-livro').textContent.trim();
      const local = card.querySelector('.local-livro').textContent
        .replace(/\s+/g, ' ').trim().replace(/^Est /, 'estante ').replace(' - ', ', ');
      const status = card.querySelector('.status-livro').textContent.trim().toLowerCase();
      return titulo + ', ' + local + ', ' + status;
    });

    const total = cards.length;
    const inicio = total === 1 ? 'Encontrei 1 livro' : 'Encontrei ' + total + ' livros';
    return total <= 3
      ? inicio + ' para ' + termo + ': ' + itens.join('. ') + '.'
      : inicio + ' para ' + termo + '. Os três primeiros: ' + itens.join('. ') + '.';
  }

  // Preenche o campo, deixa o script.js fazer a busca e lê o resultado em voz alta
  function buscarTermo(termo) {
    const campo = document.getElementById('busca-input');
    const lista = document.getElementById('lista-resultados');
    if (!campo || !lista) return;

    mostrarAviso('Buscando…', 0);
    let anunciou = false;

    const anunciar = (texto) => {
      if (anunciou) return;
      anunciou = true;
      observador.disconnect();
      mostrarAviso(texto, 6000);
      falarEDepois(texto);
    };

    const observador = new MutationObserver(() => anunciar(resumoDosResultados(termo)));
    observador.observe(lista, { childList: true });
    setTimeout(() => anunciar('Não foi possível carregar os resultados.'), 5000);

    campo.value = termo;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function tratarBusca(texto) {
    const original = limpar(texto);
    const busca = original.match(REGEX_BUSCA);
    const termo = (busca ? busca[1] : original).trim();
    if (termo) buscarTermo(termo);
    else falarEDepois('Diga o nome do livro ou do autor.');
  }

  // ---------- Ligar tudo nas telas ----------
  // Microfones da Home e da Busca
  const emBusca = !!document.getElementById('lista-resultados');
  document.querySelectorAll('.botao-microfone').forEach((botao) => {
    botao.addEventListener('click', () => ouvir(botao, emBusca ? tratarBusca : tratarHome));
  });

  // Tela de entrada: o bloco do assistente de voz vira um botão
  const assistente = document.querySelector('.assistente-voz');
  if (assistente) {
    assistente.setAttribute('role', 'button');
    assistente.setAttribute('tabindex', '0');
    assistente.setAttribute('aria-label', 'Comando de voz. Toque e diga "entrar" para continuar.');
    assistente.addEventListener('click', () => ouvir(assistente, tratarEntrada));
    assistente.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();
        ouvir(assistente, tratarEntrada);
      }
    });
  }

  // Busca digitada na Home: leva o texto para a tela de Busca
  const formHome = document.getElementById('form-busca-home');
  if (formHome) {
    formHome.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const termo = document.getElementById('busca-home').value.trim();
      window.location.href = 'busca.html' + (termo ? '?q=' + encodeURIComponent(termo) : '');
    });
  }

  // Tela de Busca aberta com um termo (vindo da Home): busca e lê o resultado
  const termoDaUrl = new URLSearchParams(window.location.search).get('q');
  if (emBusca && termoDaUrl) buscarTermo(termoDaUrl.trim());
})();