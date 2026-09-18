
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