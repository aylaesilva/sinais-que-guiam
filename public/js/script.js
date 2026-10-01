
// ===== Mostrar/ocultar senha =====
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

// ===== Avançar automaticamente entre os campos do código =====
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

// ===== Gerar card de livro (usado na Busca, Favoritos, Home) =====
function criarCardLivro(livro) {
  const disponivel = livro.disponivel;

  return `
    <li class="card-livro">
      <img src="${livro.capa_url}" alt="" class="capa-livro">
      <div class="info-livro">
        <p class="titulo-livro">${livro.titulo}</p>
        <p class="autor-livro">${livro.autor}</p>
        <p class="local-livro">
          <i class="ph ph-map-pin" aria-hidden="true"></i>
          Est ${livro.estante} - Corredor ${livro.corredor}
        </p>
        <span class="status-livro ${disponivel ? 'status-disponivel' : 'status-indisponivel'}">
          ${disponivel ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
      <div class="acoes-livro">
        <button type="button" class="botao-favoritar" data-livro-id="${livro.id}" aria-label="Favoritar ${livro.titulo}">
          <i class="ph ph-star" aria-hidden="true"></i>
        </button>
        <a href="detalhes-livro.html?id=${livro.id}" class="botao-ver-detalhes">Ver detalhes</a>
      </div>
    </li>
  `;
}

// ===== Filtros da tela de Busca =====
document.querySelectorAll('.filtro').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.filtro').forEach((b) => b.classList.remove('ativo'));
    botao.classList.add('ativo');
    // A lógica de filtrar de verdade entra na Etapa 22, junto com a API
  });
});

// ===== Navegação: destacar estantes e desenhar a rota =====
// Dados de exemplo — na Etapa 22 isso virá do back-end (livro escolhido + posição atual do usuário)
const dadosNavegacao = {
  suaEstante: 'A1',
  estanteDestino: 'A3',
  caminho: ['A1', 'A2', 'A3'], // sequência de estantes no percurso
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

// ===== Botão Repetir: relê a instrução em voz alta =====
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

// ===== Escanear QR Code =====
const botaoLerQrcode = document.getElementById('botao-ler-qrcode');
if (botaoLerQrcode) {
  botaoLerQrcode.addEventListener('click', () => {
    const status = document.getElementById('status-qrcode');
    status.textContent = 'Funcionalidade de câmera ainda não implementada.';
  });
}

// ===== Solicitar ajuda =====
const botaoChamar = document.getElementById('botao-chamar');
if (botaoChamar) {
  botaoChamar.addEventListener('click', () => {
    document.getElementById('confirmacao-ajuda').classList.remove('oculto');
  });
}

// ===== Remover favorito (delegação de evento, já que os cards são gerados dinamicamente) =====
const listaFavoritos = document.getElementById('lista-favoritos');
if (listaFavoritos) {
  listaFavoritos.addEventListener('click', (evento) => {
    const botaoRemover = evento.target.closest('.botao-remover-favorito');
    if (!botaoRemover) return;

    const card = botaoRemover.closest('.card-livro');
    card.remove();
    // A remoção real no banco (tabela favorito) entra na Etapa 22

    if (listaFavoritos.children.length === 0) {
      document.getElementById('mensagem-vazia-favoritos').classList.remove('oculto');
    }
  });
}

// ===== Card de livro favoritado (com botão de remover, usado em Favoritos) =====
function criarCardFavorito(livro) {
  return `
    <li class="card-livro">
      <img src="${livro.capa_url}" alt="" class="capa-livro">
      <div class="info-livro">
        <p class="titulo-livro">${livro.titulo}</p>
        <p class="autor-livro">${livro.autor}</p>
        <a href="detalhes-livro.html?id=${livro.id}" class="botao-ver-detalhes">Ver livro</a>
      </div>
      <button type="button" class="botao-remover-favorito" data-livro-id="${livro.id}" aria-label="Remover ${livro.titulo} dos favoritos">
        <i class="ph ph-trash" aria-hidden="true"></i>
      </button>
    </li>
  `;
}

// ===== Card de item do histórico =====
function criarItemHistorico(item) {
  // item.tipo_acao: 'navegacao' ou 'busca' (definido na tabela historico do banco)
  const icone = item.tipo_acao === 'navegacao' ? 'ph-map-pin' : 'ph-magnifying-glass';
  const corIcone = item.tipo_acao === 'navegacao' ? 'icone-historico-verde' : 'icone-historico-azul';

  return `
    <li class="item-historico">
      <span class="icone-historico ${corIcone}">
        <i class="ph-fill ${icone}" aria-hidden="true"></i>
      </span>
      <div>
        <p class="titulo-historico">${item.descricao}</p>
        <p class="data-historico">${item.data_formatada}</p>
      </div>
    </li>
  `;
}

// ===== Gerar inicial do avatar a partir do nome =====
function gerarInicialAvatar(nomeCompleto) {
  return nomeCompleto.trim().charAt(0).toUpperCase();
}

// Exemplo de uso (na Etapa 22, "usuarioLogado.nome" virá da API):
const elementoInicial = document.getElementById('inicial-avatar-grande');
if (elementoInicial) {
  const nomeExemplo = document.getElementById('nome-completo-perfil').textContent;
  elementoInicial.textContent = gerarInicialAvatar(nomeExemplo);
}

// ===== Ações do Perfil =====
const botaoSair = document.getElementById('botao-sair');
if (botaoSair) {
  botaoSair.addEventListener('click', () => {
    const confirmar = confirm('Tem certeza que deseja sair da conta?');
    if (confirmar) {
      // Etapa 22: limpar sessão/token e então redirecionar
      window.location.href = 'login.html';
    }
  });
}

const botaoEditarDados = document.getElementById('botao-editar-dados');
if (botaoEditarDados) {
  botaoEditarDados.addEventListener('click', () => {
    alert('Edição de dados será implementada na Etapa 22, junto com o back-end.');
  });
}

const botaoAlterarSenha = document.getElementById('botao-alterar-senha');
if (botaoAlterarSenha) {
  botaoAlterarSenha.addEventListener('click', () => {
    window.location.href = 'redefinir-senha.html';
  });
}

// ===== Configurações: aplicar e salvar preferências =====
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
  // Etapa 22: também enviar para o back-end (PUT /usuario/preferencias)
}

function aplicarPreferencias(prefs) {
  document.documentElement.dataset.tema = prefs.tema;
  document.documentElement.classList.toggle('alto-contraste', prefs.contraste);
  document.documentElement.dataset.tamanhoFonte = prefs.tamanhoFonte;
}

// Aplica em TODA página, não só em Configurações
let preferenciasAtuais = carregarPreferencias();
aplicarPreferencias(preferenciasAtuais);

// A partir daqui, só roda se estivermos na tela de Configurações
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

  // ===== Grupos de opções (Tamanho da Fonte, Velocidade da Voz) =====
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

  // ===== Tema (Claro/Escuro) =====
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

  // ===== Idioma =====
  const selectIdioma = document.getElementById('select-idioma');
  selectIdioma.value = preferenciasAtuais.idioma;
  selectIdioma.addEventListener('change', () => {
    preferenciasAtuais.idioma = selectIdioma.value;
    salvarPreferencias(preferenciasAtuais);
  });
}

// ===== Envio do formulário de Cadastro =====
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

// ===== Envio do formulário de Login =====
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