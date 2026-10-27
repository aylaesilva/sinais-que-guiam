// =====================================================
// UTILITÁRIOS
// =====================================================

// Usuário logado (guardado no login)
function obterUsuarioLogado() {
  const salvo = sessionStorage.getItem('usuarioLogado');
  return salvo ? JSON.parse(salvo) : null;
}

// Escapa texto vindo do banco antes de usar dentro de innerHTML
function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Páginas que não exigem login
const PAGINAS_PUBLICAS = ['', 'index.html', 'login.html', 'cadastro.html', 'esqueceu-senha.html', 'codigo.html', 'redefinir-senha.html'];
const PAGINA_ATUAL = window.location.pathname.split('/').pop();

// Se a sessão no servidor acabou (ex.: servidor reiniciado), volta para o login
(function () {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const resposta = await fetchOriginal(...args);
    if (resposta.status === 401 && !PAGINAS_PUBLICAS.includes(PAGINA_ATUAL)) {
      sessionStorage.clear();
      window.location.href = 'login.html';
    }
    return resposta;
  };
})();

// Sem usuário guardado no navegador: vai para o login (o servidor também confere a sessão)
if (!PAGINAS_PUBLICAS.includes(PAGINA_ATUAL) && !obterUsuarioLogado()) {
  window.location.href = 'login.html';
}

// Gerar inicial do avatar a partir do nome
function gerarInicialAvatar(nomeCompleto) {
  return nomeCompleto.trim().charAt(0).toUpperCase();
}

// =====================================================
// PREFERÊNCIAS (tema, contraste, fonte): valem em todas as páginas
// =====================================================
const CHAVE_PREFERENCIAS = 'sinaisQueGuiam_preferencias';

function carregarPreferencias() {
  const salvas = localStorage.getItem(CHAVE_PREFERENCIAS);
  return salvas ? JSON.parse(salvas) : {
    contraste: false,
    vibracao: false,
    tamanhoFonte: 'G',
    velocidadeVoz: '1.0x',
    tema: 'claro',
    idioma: 'pt-BR',
  };
}

function salvarPreferencias(prefs) {
  localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(prefs));
  // Próxima etapa: também enviar para o back-end (PUT /api/usuarios/:id/preferencias)
}

function aplicarPreferencias(prefs) {
  document.documentElement.dataset.tema = prefs.tema;
  document.documentElement.classList.toggle('alto-contraste', prefs.contraste);
  document.documentElement.dataset.tamanhoFonte = prefs.tamanhoFonte;
}

let preferenciasAtuais = carregarPreferencias();
aplicarPreferencias(preferenciasAtuais);

// =====================================================
// MOSTRAR/OCULTAR SENHA
// =====================================================
document.querySelectorAll('.botao-mostrar-senha').forEach((botao) => {
  botao.addEventListener('click', () => {
    const campo = document.getElementById(botao.dataset.alvo);
    const icone = botao.querySelector('i');
    const mostrando = campo.type === 'text';

    campo.type = mostrando ? 'password' : 'text';
    botao.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
    icone.classList.toggle('ph-eye', mostrando);
    icone.classList.toggle('ph-eye-slash', !mostrando);
  });
});

// =====================================================
// CÓDIGO DE VERIFICAÇÃO: avança entre os campos
// =====================================================
const camposCodigo = document.querySelectorAll('.campo-codigo input');

camposCodigo.forEach((campo, indice) => {
  campo.addEventListener('input', () => {
    if (campo.value.length === 1 && indice < camposCodigo.length - 1) {
      camposCodigo[indice + 1].focus();
    }
  });

  campo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Backspace' && campo.value === '' && indice > 0) {
      camposCodigo[indice - 1].focus();
    }
  });
});

// =====================================================
// CARDS (HTML gerado a partir dos dados da API)
// =====================================================

// Card de livro (Busca)
function criarCardLivro(livro) {
  const disponivel = livro.disponivel;
  const titulo = escaparHtml(livro.titulo);
  const capa = livro.capa_url
    ? `<img src="${escaparHtml(livro.capa_url)}" alt="" class="capa-livro">`
    : '<div class="capa-livro"></div>';

  return `
    <li class="card-livro">
      ${capa}
      <div class="info-livro">
        <p class="titulo-livro">${titulo}</p>
        <p class="autor-livro">${escaparHtml(livro.autor)}</p>
        <p class="local-livro">
          <i class="ph ph-map-pin" aria-hidden="true"></i>
          Est ${escaparHtml(livro.estante)} - ${escaparHtml(livro.corredor)}
        </p>
        <span class="status-livro ${disponivel ? 'status-disponivel' : 'status-indisponivel'}">
          ${disponivel ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
      <div class="acoes-livro">
        <button type="button" class="botao-favoritar" data-livro-id="${livro.id}" aria-label="Favoritar ${titulo}">
          <i class="ph ph-star" aria-hidden="true"></i>
        </button>
        <a href="detalhes-livro.html?id=${livro.id}" class="botao-ver-detalhes">Ver detalhes</a>
      </div>
    </li>
  `;
}

// Card de livro favoritado, com botão de remover (Favoritos)
function criarCardFavorito(livro) {
  const titulo = escaparHtml(livro.titulo);
  const capa = livro.capa_url
    ? `<img src="${escaparHtml(livro.capa_url)}" alt="" class="capa-livro">`
    : '<div class="capa-livro"></div>';

  return `
    <li class="card-livro">
      ${capa}
      <div class="info-livro">
        <p class="titulo-livro">${titulo}</p>
        <p class="autor-livro">${escaparHtml(livro.autor)}</p>
        <a href="detalhes-livro.html?id=${livro.id}" class="botao-ver-detalhes">Ver livro</a>
      </div>
      <button type="button" class="botao-remover-favorito" data-livro-id="${livro.id}" aria-label="Remover ${titulo} dos favoritos">
        <i class="ph ph-trash" aria-hidden="true"></i>
      </button>
    </li>
  `;
}

// Card pequeno de livro recente (Home)
function criarCardRecente(livro) {
  const capa = livro.capa_url
    ? `<img src="${escaparHtml(livro.capa_url)}" alt="" class="capa-recente">`
    : '<div class="capa-recente"></div>';

  return `
    <a href="detalhes-livro.html?id=${livro.id}" class="card-recente">
      ${capa}
      <p class="titulo-recente">${escaparHtml(livro.titulo)}</p>
      <p class="autor-recente">${escaparHtml(livro.autor)}</p>
    </a>
  `;
}

// Item do histórico
function criarItemHistorico(item) {
  const icone = item.tipo_acao === 'navegacao' ? 'ph-map-pin' : 'ph-magnifying-glass';
  const corIcone = item.tipo_acao === 'navegacao' ? 'icone-historico-verde' : 'icone-historico-azul';

  return `
    <li class="item-historico">
      <span class="icone-historico ${corIcone}">
        <i class="ph-fill ${icone}" aria-hidden="true"></i>
      </span>
      <div>
        <p class="titulo-historico">${escaparHtml(item.descricao)}</p>
        <p class="data-historico">${escaparHtml(item.data_formatada)}</p>
      </div>
    </li>
  `;
}

// =====================================================
// HOME: nome do usuário + livros recentes
// =====================================================
(function () {
  const nomeEl = document.getElementById('nome-usuario');
  const usuario = obterUsuarioLogado();
  if (nomeEl && usuario) {
    nomeEl.textContent = usuario.nome.trim().split(' ')[0];
    document.getElementById('inicial-avatar').textContent = gerarInicialAvatar(usuario.nome);
  }

  const listaRecentes = document.getElementById('lista-livros-recentes');
  if (!listaRecentes) return;

  fetch('/api/livros/recentes')
    .then((resposta) => resposta.json())
    .then((dados) => {
      listaRecentes.innerHTML = dados.livros.length
        ? dados.livros.map((livro) => criarCardRecente(livro)).join('')
        : '<p class="texto-carregando">Nenhum livro cadastrado ainda.</p>';
    })
    .catch(() => {
      listaRecentes.innerHTML = '<p class="texto-carregando">Não foi possível carregar os livros.</p>';
    });
})();

// =====================================================
// BUSCA: livros da API, filtros e favoritos
// =====================================================
(function () {
  const lista = document.getElementById('lista-resultados');
  if (!lista) return;

  const campoBusca = document.getElementById('busca-input');
  const contador = document.getElementById('contador-resultados');
  const usuario = obterUsuarioLogado();
  let filtroAtual = 'todos';
  let temporizador;
  let favoritosIds = [];

  async function carregarFavoritos() {
    if (!usuario) return;
    try {
      const resposta = await fetch('/api/favoritos/ids?usuario_id=' + usuario.id);
      const dados = await resposta.json();
      favoritosIds = dados.ids || [];
    } catch (erro) {
      favoritosIds = [];
    }
  }

  function pintarEstrela(botao, favoritado) {
    const icone = botao.querySelector('i');
    icone.classList.toggle('ph-fill', favoritado);
    icone.classList.toggle('ph', !favoritado);
    botao.setAttribute('aria-pressed', String(favoritado));
  }

  async function carregarLivros() {
    const termo = campoBusca.value.trim();
    const params = new URLSearchParams();
    if (termo) {
      params.set('busca', termo);
      if (filtroAtual !== 'todos') params.set('filtro', filtroAtual);
    }

    try {
      const resposta = await fetch('/api/livros?' + params.toString());
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro);

      lista.innerHTML = dados.livros.map((livro) => criarCardLivro(livro)).join('');
      contador.textContent = `${dados.total} resultado(s) encontrado(s)`;

      lista.querySelectorAll('.botao-favoritar').forEach((botao) => {
        pintarEstrela(botao, favoritosIds.includes(Number(botao.dataset.livroId)));
      });
    } catch (erro) {
      contador.textContent = 'Não foi possível carregar os livros.';
    }
  }

  // Clique na estrela (delegação: funciona mesmo com cards gerados depois)
  lista.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('.botao-favoritar');
    if (!botao) return;

    if (!usuario) {
      contador.textContent = 'Faça login para favoritar livros.';
      return;
    }

    const livroId = Number(botao.dataset.livroId);
    const jaFavorito = favoritosIds.includes(livroId);

    try {
      const resposta = await fetch(`/api/livros/${livroId}/favorito`, {
        method: jaFavorito ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id }),
      });
      if (!resposta.ok) throw new Error();

      favoritosIds = jaFavorito
        ? favoritosIds.filter((id) => id !== livroId)
        : [...favoritosIds, livroId];
      pintarEstrela(botao, !jaFavorito);
    } catch (erro) {
      contador.textContent = 'Não foi possível atualizar os favoritos.';
    }
  });

  // Busca enquanto digita (espera 300 ms depois da última tecla)
  campoBusca.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(carregarLivros, 300);
  });

  // Filtros: Todos, Título, Categoria, Autor
  document.querySelectorAll('.filtro').forEach((botao) => {
    botao.addEventListener('click', () => {
      document.querySelectorAll('.filtro').forEach((b) => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      filtroAtual = botao.dataset.filtro;
      carregarLivros();
    });
  });

  carregarFavoritos().then(carregarLivros);
})();

// =====================================================
// DETALHES DO LIVRO
// =====================================================
(function () {
  if (!document.getElementById('titulo-livro-detalhe')) return;

  const usuario = obterUsuarioLogado();
  if (!usuario) return;

  const livroId = new URLSearchParams(window.location.search).get('id');
  const cabecalhos = { 'Content-Type': 'application/json' };
  const botaoReservar = document.getElementById('botao-reservar');
  const botaoFavoritar = document.getElementById('botao-favoritar');
  const botaoFavoritarTopo = document.getElementById('botao-favoritar-topo');
  const modalReserva = document.getElementById('modal-reserva');
  let livroAtual = null;
  let favorito = false;

  // Mensagem de erro criada aqui, para não precisar mexer no HTML
  const mensagem = document.createElement('p');
  mensagem.className = 'mensagem-erro';
  mensagem.setAttribute('role', 'alert');
  document.querySelector('.acoes-secundarias').before(mensagem);

  function pintarFavorito(ativo) {
    favorito = ativo;
    [botaoFavoritar, botaoFavoritarTopo].forEach((botao) => {
      const icone = botao.querySelector('i');
      icone.classList.toggle('ph-fill', ativo);
      icone.classList.toggle('ph', !ativo);
      botao.setAttribute('aria-pressed', String(ativo));
    });
    botaoFavoritarTopo.setAttribute('aria-label', ativo ? 'Remover dos favoritos' : 'Favoritar');
  }

  async function carregarLivro() {
    if (!livroId) {
      mensagem.textContent = 'Livro não informado.';
      return;
    }
    try {
      const resposta = await fetch('/api/livros/' + livroId);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro);
      livroAtual = dados.livro;

      document.title = livroAtual.titulo + ' - Sinais que Guiam';
      document.getElementById('titulo-livro-detalhe').textContent = livroAtual.titulo;
      document.getElementById('autor-livro-detalhe').textContent = livroAtual.autor;
      document.getElementById('categoria-livro').textContent = livroAtual.categoria || 'Sem categoria';
      document.getElementById('estante-livro').textContent = livroAtual.estante;
      document.getElementById('corredor-livro').textContent = livroAtual.corredor;
      document.getElementById('prateleira-livro').textContent = livroAtual.prateleira || '—';
      document.getElementById('resumo-livro').textContent = livroAtual.resumo || 'Este livro ainda não tem resumo cadastrado.';

      const capa = document.getElementById('capa-livro-detalhe');
      if (livroAtual.capa_url) capa.src = livroAtual.capa_url;
      else capa.removeAttribute('src');

      if (!livroAtual.disponivel) {
        botaoReservar.disabled = true;
        botaoReservar.textContent = 'Indisponível';
      }

      // Registra no histórico que o usuário consultou este livro
      fetch('/api/historico', {
        method: 'POST',
        headers: cabecalhos,
        body: JSON.stringify({ usuario_id: usuario.id, tipo_acao: 'busca', referencia: String(livroAtual.id), descricao: livroAtual.titulo }),
      });

      const respFav = await fetch('/api/favoritos/ids?usuario_id=' + usuario.id);
      const dadosFav = await respFav.json();
      pintarFavorito((dadosFav.ids || []).includes(Number(livroId)));
    } catch (erro) {
      mensagem.textContent = 'Não foi possível carregar este livro.';
    }
  }

  async function alternarFavorito() {
    mensagem.textContent = '';
    try {
      const resposta = await fetch(`/api/livros/${livroId}/favorito`, {
        method: favorito ? 'DELETE' : 'POST',
        headers: cabecalhos,
        body: JSON.stringify({ usuario_id: usuario.id }),
      });
      if (!resposta.ok) throw new Error();
      pintarFavorito(!favorito);
    } catch (erro) {
      mensagem.textContent = 'Não foi possível atualizar os favoritos.';
    }
  }
  botaoFavoritar.addEventListener('click', alternarFavorito);
  botaoFavoritarTopo.addEventListener('click', alternarFavorito);

  botaoReservar.addEventListener('click', async () => {
    mensagem.textContent = '';
    botaoReservar.disabled = true;
    try {
      const resposta = await fetch(`/api/livros/${livroId}/reserva`, {
        method: 'POST',
        headers: cabecalhos,
        body: JSON.stringify({ usuario_id: usuario.id }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        mensagem.textContent = dados.erro;
        if (resposta.status === 409) botaoReservar.textContent = 'Indisponível';
        else botaoReservar.disabled = false;
        return;
      }

      document.getElementById('modal-codigo-reserva').textContent = dados.codigo_reserva;
      document.getElementById('modal-data-emprestimo').textContent = dados.data_emprestimo;
      document.getElementById('modal-nome-usuario').textContent = dados.nome_usuario;
      document.getElementById('modal-data-devolucao').textContent = dados.data_devolucao;
      modalReserva.classList.remove('oculto');
      modalReserva.querySelector('button').focus();
      botaoReservar.textContent = 'Reservado';
    } catch (erro) {
      mensagem.textContent = 'Não foi possível reservar. Tente novamente.';
      botaoReservar.disabled = false;
    }
  });

  // Esc fecha o modal da reserva
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') modalReserva.classList.add('oculto');
  });

  // Ler o resumo em voz alta, na velocidade escolhida em Configurações
  document.getElementById('botao-ler-resumo').addEventListener('click', () => {
    if (!livroAtual) return;
    speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(
      `${livroAtual.titulo}, de ${livroAtual.autor}. ${livroAtual.resumo || 'Este livro não tem resumo cadastrado.'}`
    );
    fala.lang = 'pt-BR';
    fala.rate = parseFloat(carregarPreferencias().velocidadeVoz) || 1;
    speechSynthesis.speak(fala);
  });

  // Iniciar navegação: registra no histórico (o botão já leva para navegacao.html pelo HTML)
  document.getElementById('botao-iniciar-navegacao').addEventListener('click', () => {
    if (!livroAtual) return;
    fetch('/api/historico', {
      method: 'POST',
      headers: cabecalhos,
      keepalive: true, // deixa o envio terminar mesmo trocando de página
      body: JSON.stringify({
        usuario_id: usuario.id,
        tipo_acao: 'navegacao',
        referencia: livroAtual.estante,
        descricao: 'Navegação até Estante ' + livroAtual.estante,
      }),
    });
  });

  carregarLivro();
})();

// =====================================================
// NAVEGAÇÃO: destacar estantes e desenhar a rota
// (ainda com dados de exemplo; próxima etapa: usar a estante do livro escolhido)
// =====================================================
const dadosNavegacao = {
  suaEstante: 'A1',
  estanteDestino: 'A3',
  caminho: ['A1', 'A2', 'A3'],
};

function iniciarMapaNavegacao(dados) {
  const grade = document.getElementById('grade-estantes');
  if (!grade) return;

  grade.querySelectorAll('.estante').forEach((celula) => {
    celula.classList.remove('estante-voce', 'estante-destino', 'estante-caminho');

    const codigo = celula.dataset.estante;
    if (codigo === dados.suaEstante) celula.classList.add('estante-voce');
    if (codigo === dados.estanteDestino) celula.classList.add('estante-destino');
    if (dados.caminho.includes(codigo)) celula.classList.add('estante-caminho');
  });

  desenharLinhaRota(dados);
}

function desenharLinhaRota(dados) {
  const grade = document.getElementById('grade-estantes');
  const linha = document.getElementById('linha-rota');
  const inicio = grade.querySelector(`[data-estante="${dados.suaEstante}"]`);
  const fim = grade.querySelector(`[data-estante="${dados.estanteDestino}"]`);
  if (!inicio || !fim) return;

  const areaGrade = grade.getBoundingClientRect();
  const areaInicio = inicio.getBoundingClientRect();
  const areaFim = fim.getBoundingClientRect();

  const x1 = areaInicio.left + areaInicio.width / 2 - areaGrade.left;
  const y1 = areaInicio.top + areaInicio.height / 2 - areaGrade.top;
  const x2 = areaFim.left + areaFim.width / 2 - areaGrade.left;
  const y2 = areaFim.top + areaFim.height / 2 - areaGrade.top;

  const comprimento = Math.hypot(x2 - x1, y2 - y1);
  const angulo = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  linha.style.width = `${comprimento}px`;
  linha.style.left = `${x1}px`;
  linha.style.top = `${y1}px`;
  linha.style.transform = `rotate(${angulo}deg)`;
}

// Botão Repetir: relê a instrução em voz alta
const botaoRepetir = document.getElementById('botao-repetir');
if (botaoRepetir) {
  botaoRepetir.addEventListener('click', () => {
    const texto = document.getElementById('texto-instrucao').textContent;
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    speechSynthesis.speak(fala);
  });
}

// Só roda se a grade de navegação existir nesta página
if (document.getElementById('grade-estantes')) {
  window.addEventListener('load', () => iniciarMapaNavegacao(dadosNavegacao));
  window.addEventListener('resize', () => desenharLinhaRota(dadosNavegacao));
}

// =====================================================
// ESCANEAR QR CODE (câmera ainda não implementada)
// =====================================================
const botaoLerQrcode = document.getElementById('botao-ler-qrcode');
if (botaoLerQrcode) {
  botaoLerQrcode.addEventListener('click', () => {
    const status = document.getElementById('status-qrcode');
    status.textContent = 'Funcionalidade de câmera ainda não implementada.';
  });
}

// =====================================================
// SOLICITAR AJUDA
// =====================================================
(function () {
  const botao = document.getElementById('botao-chamar');
  if (!botao) return;
  const aviso = document.getElementById('confirmacao-ajuda');

  function mostrarAviso(texto, erro) {
    aviso.className = 'confirmacao-ajuda' + (erro ? ' erro' : '');
    aviso.innerHTML = `<i class="ph-fill ${erro ? 'ph-warning-circle' : 'ph-check-circle'}" aria-hidden="true"></i> ${escaparHtml(texto)}`;
  }

  botao.addEventListener('click', async () => {
    const usuario = obterUsuarioLogado();
    if (!usuario) return;

    try {
      const resposta = await fetch('/api/ajuda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id }),
      });
      const dados = await resposta.json();
      mostrarAviso(resposta.ok ? dados.mensagem : dados.erro, !resposta.ok);
    } catch (erro) {
      mostrarAviso('Não foi possível enviar a solicitação. Tente novamente.', true);
    }
  });
})();

// =====================================================
// FAVORITOS: listar e remover de verdade
// =====================================================
(function () {
  const lista = document.getElementById('lista-favoritos');
  if (!lista) return;

  const usuario = obterUsuarioLogado();
  const mensagemVazia = document.getElementById('mensagem-vazia-favoritos');

  function mostrarMensagem(texto) {
    mensagemVazia.textContent = texto;
    mensagemVazia.classList.remove('oculto');
  }

  async function carregarFavoritosTela() {
    if (!usuario) {
      mostrarMensagem('Faça login para ver seus favoritos.');
      return;
    }
    try {
      const resposta = await fetch('/api/favoritos?usuario_id=' + usuario.id);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro);

      lista.innerHTML = dados.livros.map((livro) => criarCardFavorito(livro)).join('');
      if (dados.livros.length === 0) mostrarMensagem('Você ainda não tem livros favoritos.');
    } catch (erro) {
      mostrarMensagem('Não foi possível carregar os favoritos.');
    }
  }

  lista.addEventListener('click', async (evento) => {
    const botaoRemover = evento.target.closest('.botao-remover-favorito');
    if (!botaoRemover || !usuario) return;

    try {
      const resposta = await fetch(`/api/livros/${botaoRemover.dataset.livroId}/favorito`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id }),
      });
      if (!resposta.ok) throw new Error();

      botaoRemover.closest('.card-livro').remove();
      if (lista.children.length === 0) {
        mostrarMensagem('Você ainda não tem livros favoritos.');
      }
    } catch (erro) {
      mostrarMensagem('Não foi possível remover o favorito.');
    }
  });

  carregarFavoritosTela();
})();

// =====================================================
// HISTÓRICO
// =====================================================
(function () {
  const lista = document.getElementById('lista-historico');
  if (!lista) return;

  const usuario = obterUsuarioLogado();
  if (!usuario) return;
  const aviso = document.getElementById('mensagem-vazia-historico');

  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.classList.remove('oculto');
  }

  fetch('/api/historico?usuario_id=' + usuario.id)
    .then((resposta) => resposta.json().then((dados) => ({ ok: resposta.ok, dados })))
    .then(({ ok, dados }) => {
      if (!ok) throw new Error(dados.erro);
      lista.innerHTML = dados.historico.map((item) => criarItemHistorico(item)).join('');
      if (dados.historico.length === 0) mostrarAviso('Nenhuma atividade registrada ainda.');
    })
    .catch(() => mostrarAviso('Não foi possível carregar o histórico.'));
})();

// =====================================================
// PERFIL: dados reais + ações
// =====================================================
(function () {
  if (!document.getElementById('nome-perfil')) return;

  const usuario = obterUsuarioLogado();
  if (!usuario) return;

  const rotulosDeficiencia = { baixa_visao: 'Baixa visão', cegueira: 'Cegueira', daltonismo: 'Daltonismo' };

  fetch('/api/usuarios/' + usuario.id)
    .then((resposta) => resposta.json().then((dados) => ({ ok: resposta.ok, dados })))
    .then(({ ok, dados }) => {
      if (!ok) throw new Error(dados.erro);
      const u = dados.usuario;

      document.getElementById('nome-completo-perfil').textContent = u.nome;
      document.getElementById('nome-perfil').textContent = u.nome;
      document.getElementById('email-perfil').textContent = u.email;
      document.getElementById('telefone-perfil').textContent = u.telefone || 'Não informado';
      document.getElementById('inicial-avatar-grande').textContent = gerarInicialAvatar(u.nome);
      document.getElementById('curso-perfil').hidden = true;

      const badge = document.getElementById('badge-deficiencia');
      const rotulo = rotulosDeficiencia[u.tipo_deficiencia];
      if (rotulo) badge.textContent = rotulo;
      else badge.hidden = true;
    })
    .catch(() => {
      document.getElementById('nome-completo-perfil').textContent = 'Não foi possível carregar o perfil.';
    });
})();

const botaoSair = document.getElementById('botao-sair');
if (botaoSair) {
  botaoSair.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja sair da conta?')) return;

    try {
      await fetch('/api/logout', { method: 'POST' }); // encerra a sessão no servidor
    } catch (erro) {
      // mesmo sem resposta do servidor, limpa este aparelho
    }
    sessionStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('destinoNavegacao');
    sessionStorage.removeItem('posicaoAtual');
    localStorage.removeItem(CHAVE_PREFERENCIAS);
    window.location.href = 'login.html';
  });
}

const botaoEditarDados = document.getElementById('botao-editar-dados');
if (botaoEditarDados) {
  botaoEditarDados.addEventListener('click', () => {
    alert('Edição de dados será implementada em breve, junto com o back-end.');
  });
}

const botaoAlterarSenha = document.getElementById('botao-alterar-senha');
if (botaoAlterarSenha) {
  botaoAlterarSenha.addEventListener('click', () => {
    window.location.href = 'redefinir-senha.html';
  });
}

// =====================================================
// CONFIGURAÇÕES (ainda salvas só no navegador)
// =====================================================
if (document.getElementById('toggle-contraste')) {
  const toggleContraste = document.getElementById('toggle-contraste');
  const toggleVibracao = document.getElementById('toggle-vibracao');

  toggleContraste.checked = preferenciasAtuais.contraste;
  toggleVibracao.checked = preferenciasAtuais.vibracao;

  toggleContraste.addEventListener('change', () => {
    preferenciasAtuais.contraste = toggleContraste.checked;
    salvarPreferencias(preferenciasAtuais);
    aplicarPreferencias(preferenciasAtuais);
  });

  toggleVibracao.addEventListener('change', () => {
    preferenciasAtuais.vibracao = toggleVibracao.checked;
    salvarPreferencias(preferenciasAtuais);
    if (preferenciasAtuais.vibracao && navigator.vibrate) {
      navigator.vibrate(100); // feedback imediato ao ativar
    }
  });

  // Grupos de opções (Tamanho da Fonte, Velocidade da Voz)
  function configurarGrupoPilulas(idGrupo, chavePreferencia) {
    const grupo = document.getElementById(idGrupo);
    grupo.querySelectorAll('.opcao-pilula').forEach((botao) => {
      botao.addEventListener('click', () => {
        grupo.querySelectorAll('.opcao-pilula').forEach((b) => {
          b.classList.remove('ativo');
          b.setAttribute('aria-checked', 'false');
        });
        botao.classList.add('ativo');
        botao.setAttribute('aria-checked', 'true');

        preferenciasAtuais[chavePreferencia] = botao.dataset.valor;
        salvarPreferencias(preferenciasAtuais);
        aplicarPreferencias(preferenciasAtuais);
      });
    });
  }

  configurarGrupoPilulas('grupo-fonte', 'tamanhoFonte');
  configurarGrupoPilulas('grupo-velocidade', 'velocidadeVoz');

  // Tema (Claro/Escuro)
  document.querySelectorAll('.opcao-tema').forEach((botao) => {
    botao.addEventListener('click', () => {
      document.querySelectorAll('.opcao-tema').forEach((b) => {
        b.classList.remove('ativo');
        b.setAttribute('aria-checked', 'false');
      });
      botao.classList.add('ativo');
      botao.setAttribute('aria-checked', 'true');

      preferenciasAtuais.tema = botao.dataset.tema;
      salvarPreferencias(preferenciasAtuais);
      aplicarPreferencias(preferenciasAtuais);
    });
  });

  // Idioma
  const selectIdioma = document.getElementById('select-idioma');
  selectIdioma.value = preferenciasAtuais.idioma;
  selectIdioma.addEventListener('change', () => {
    preferenciasAtuais.idioma = selectIdioma.value;
    salvarPreferencias(preferenciasAtuais);
  });
}

// =====================================================
// CADASTRO
// =====================================================
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
  formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const erroEl = document.getElementById('erro-cadastro');
    erroEl.textContent = '';

    const dados = {
      nome: document.getElementById('nome').value,
      email: document.getElementById('email-cadastro').value,
      telefone: document.getElementById('telefone').value,
      senha: document.getElementById('senha-cadastro').value,
      confirmar_senha: document.getElementById('confirmar-senha').value,
      tipo_deficiencia: document.getElementById('tipo-deficiencia').value,
    };

    try {
      const resposta = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        erroEl.textContent = resultado.erro;
        return;
      }

      window.location.href = 'login.html';
    } catch (erro) {
      erroEl.textContent = 'Não foi possível conectar ao servidor. Tente novamente.';
    }
  });
}

// =====================================================
// LOGIN
// =====================================================
const formLogin = document.getElementById('form-login');
if (formLogin) {
  formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const erroEl = document.getElementById('erro-login');
    erroEl.textContent = '';

    const dados = {
      email: document.getElementById('email').value,
      senha: document.getElementById('senha').value,
    };

    try {
      const resposta = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const resultado = await resposta.json();

      if (!resposta.ok) {
        erroEl.textContent = resultado.erro;
        return;
      }

      sessionStorage.setItem('usuarioLogado', JSON.stringify(resultado.usuario));
      window.location.href = 'home.html';
    } catch (erro) {
      erroEl.textContent = 'Não foi possível conectar ao servidor. Tente novamente.';
    }
  });
}