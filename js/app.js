/**
 * Aplicacao Frontend para Gerenciamento de Perifericos Corsair
 */
(function () {
  'use strict';

  // Elementos do DOM
  const elements = {
    // Estados
    stateLoading: document.getElementById('state-loading'),
    stateError: document.getElementById('state-error'),
    stateEmpty: document.getElementById('state-empty'),
    stateErrorMessage: document.getElementById('state-error-message'),
    grid: document.getElementById('perifericos-grid'),
    totalPerifericos: document.getElementById('total-perifericos'),

    // Botoes de acao
    btnNovoPeriferico: document.getElementById('btn-novo-periferico'),
    btnRecarregar: document.getElementById('btn-recarregar'),
    btnTentarNovamente: document.getElementById('btn-tentar-novamente'),
    btnAdicionarPrimeiro: document.getElementById('btn-adicionar-primeiro'),

    // Modal de Formulario
    modalForm: document.getElementById('modal-form'),
    modalFormTitle: document.getElementById('modal-form-title'),
    form: document.getElementById('periferico-form'),
    formId: document.getElementById('form-id'),
    formMarca: document.getElementById('form-marca'),
    formModelo: document.getElementById('form-modelo'),
    formPreco: document.getElementById('form-preco'),
    formFoto: document.getElementById('form-foto'),
    fotoPreviewBox: document.getElementById('foto-preview-box'),
    formGeneralError: document.getElementById('form-general-error'),
    btnFecharForm: document.getElementById('btn-fechar-form'),
    btnCancelarForm: document.getElementById('btn-cancelar-form'),
    btnSalvarForm: document.getElementById('btn-salvar-form'),
    btnSalvarTexto: document.getElementById('btn-salvar-texto'),

    // Erros de campos
    errorModelo: document.getElementById('error-modelo'),
    errorPreco: document.getElementById('error-preco'),
    errorFoto: document.getElementById('error-foto'),

    // Modal de Confirmacao
    modalConfirm: document.getElementById('modal-confirm'),
    confirmItemNome: document.getElementById('confirm-item-nome'),
    btnFecharConfirm: document.getElementById('btn-fechar-confirm'),
    btnCancelarExclusao: document.getElementById('btn-cancelar-exclusao'),
    btnConfirmarExclusao: document.getElementById('btn-confirmar-exclusao'),
    btnExcluirTexto: document.getElementById('btn-excluir-texto'),

    // Notificacoes
    toastContainer: document.getElementById('toast-container'),
  };

  // Estado local em memoria
  let perifericos = [];
  let itemParaExcluir = null;

  // Formatador de Moeda BRL
  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Validacao de URL
  function isValidHttpUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
      const url = new URL(string.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  // Notificacoes Toast
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('width', '20');
    iconSvg.setAttribute('height', '20');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('stroke', 'currentColor');
    iconSvg.setAttribute('stroke-width', '2');
    iconSvg.setAttribute('stroke-linecap', 'round');
    iconSvg.setAttribute('stroke-linejoin', 'round');
    iconSvg.classList.add('toast-icon');

    if (type === 'success') {
      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '20 6 9 17 4 12');
      iconSvg.appendChild(polyline);
    } else {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '10');
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '12');
      line1.setAttribute('y1', '8');
      line1.setAttribute('x2', '12');
      line1.setAttribute('y2', '12');
      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '12');
      line2.setAttribute('y1', '16');
      line2.setAttribute('x2', '12.01');
      line2.setAttribute('y2', '16');
      iconSvg.appendChild(circle);
      iconSvg.appendChild(line1);
      iconSvg.appendChild(line2);
    }

    const spanText = document.createElement('span');
    spanText.className = 'toast-message';
    spanText.textContent = message;

    toast.appendChild(iconSvg);
    toast.appendChild(spanText);
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  // Controle de Telas / Estados
  function setViewState(state) {
    elements.stateLoading.classList.add('hidden');
    elements.stateError.classList.add('hidden');
    elements.stateEmpty.classList.add('hidden');
    elements.grid.classList.add('hidden');

    if (state === 'loading') {
      elements.stateLoading.classList.remove('hidden');
      elements.totalPerifericos.textContent = 'Carregando itens...';
    } else if (state === 'error') {
      elements.stateError.classList.remove('hidden');
      elements.totalPerifericos.textContent = 'Erro ao consultar';
    } else if (state === 'empty') {
      elements.stateEmpty.classList.remove('hidden');
      elements.totalPerifericos.textContent = '0 perifericos cadastrados';
    } else if (state === 'ready') {
      elements.grid.classList.remove('hidden');
      const total = perifericos.length;
      elements.totalPerifericos.textContent = `${total} ${total === 1 ? 'periferico cadastrado' : 'perifericos cadastrados'}`;
    }
  }

  // Renderizacao Segura do Card de Periferico
  function createCardElement(item) {
    const card = document.createElement('article');
    card.className = 'card-periferico';
    card.setAttribute('data-id', item._id);

    // Foto e Fallback
    const fotoWrapper = document.createElement('div');
    fotoWrapper.className = 'card-foto-wrapper';

    const img = document.createElement('img');
    img.className = 'card-foto';
    img.src = item.foto;
    img.alt = `Foto do ${item.modelo}`;
    img.loading = 'lazy';

    img.onerror = function () {
      img.remove();
      const fallback = document.createElement('div');
      fallback.className = 'card-foto-fallback';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '32');
      svg.setAttribute('height', '32');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '3');
      rect.setAttribute('y', '3');
      rect.setAttribute('width', '18');
      rect.setAttribute('height', '18');
      rect.setAttribute('rx', '2');
      rect.setAttribute('ry', '2');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '8.5');
      circle.setAttribute('cy', '8.5');
      circle.setAttribute('r', '1.5');
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      poly.setAttribute('points', '21 15 16 10 5 21');
      svg.appendChild(rect);
      svg.appendChild(circle);
      svg.appendChild(poly);

      const span = document.createElement('span');
      span.textContent = 'Imagem Indisponivel';

      fallback.appendChild(svg);
      fallback.appendChild(span);
      fotoWrapper.appendChild(fallback);
    };

    fotoWrapper.appendChild(img);

    // Corpo do Card
    const body = document.createElement('div');
    body.className = 'card-body';

    const marcaTag = document.createElement('div');
    marcaTag.className = 'card-marca-tag';
    marcaTag.textContent = item.marca || 'CORSAIR';

    const modeloHeading = document.createElement('h3');
    modeloHeading.className = 'card-modelo';
    modeloHeading.textContent = item.modelo;

    const precoBox = document.createElement('div');
    precoBox.className = 'card-preco-box';

    const precoLabel = document.createElement('span');
    precoLabel.className = 'card-preco-label';
    precoLabel.textContent = 'Preco';

    const precoValor = document.createElement('span');
    precoValor.className = 'card-preco-valor';
    precoValor.textContent = currencyFormatter.format(item.preco || 0);

    precoBox.appendChild(precoLabel);
    precoBox.appendChild(precoValor);

    body.appendChild(marcaTag);
    body.appendChild(modeloHeading);
    body.appendChild(precoBox);

    // Botoes de Acao (Editar / Excluir)
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn btn-secondary card-btn';
    btnEditar.setAttribute('data-action', 'edit');

    const editIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    editIcon.setAttribute('viewBox', '0 0 24 24');
    editIcon.setAttribute('width', '14');
    editIcon.setAttribute('height', '14');
    editIcon.setAttribute('fill', 'none');
    editIcon.setAttribute('stroke', 'currentColor');
    editIcon.setAttribute('stroke-width', '2');
    const pathEdit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEdit.setAttribute('d', 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7');
    const pathEdit2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEdit2.setAttribute('d', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z');
    editIcon.appendChild(pathEdit);
    editIcon.appendChild(pathEdit2);

    const editSpan = document.createElement('span');
    editSpan.textContent = 'Editar';
    btnEditar.appendChild(editIcon);
    btnEditar.appendChild(editSpan);

    btnEditar.addEventListener('click', () => abrirModalEdicao(item));

    const btnExcluir = document.createElement('button');
    btnExcluir.type = 'button';
    btnExcluir.className = 'btn btn-danger card-btn';
    btnExcluir.setAttribute('data-action', 'delete');

    const delIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    delIcon.setAttribute('viewBox', '0 0 24 24');
    delIcon.setAttribute('width', '14');
    delIcon.setAttribute('height', '14');
    delIcon.setAttribute('fill', 'none');
    delIcon.setAttribute('stroke', 'currentColor');
    delIcon.setAttribute('stroke-width', '2');
    const poly1 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly1.setAttribute('points', '3 6 5 6 21 6');
    const pathDel = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathDel.setAttribute('d', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2');
    delIcon.appendChild(poly1);
    delIcon.appendChild(pathDel);

    const delSpan = document.createElement('span');
    delSpan.textContent = 'Excluir';
    btnExcluir.appendChild(delIcon);
    btnExcluir.appendChild(delSpan);

    btnExcluir.addEventListener('click', () => abrirModalExclusao(item));

    actions.appendChild(btnEditar);
    actions.appendChild(btnExcluir);

    card.appendChild(fotoWrapper);
    card.appendChild(body);
    card.appendChild(actions);

    return card;
  }

  // Renderizar a Lista Completa
  function renderPerifericos() {
    elements.grid.textContent = '';

    if (!perifericos || perifericos.length === 0) {
      setViewState('empty');
      return;
    }

    const fragment = document.createDocumentFragment();
    perifericos.forEach((item) => {
      fragment.appendChild(createCardElement(item));
    });

    elements.grid.appendChild(fragment);
    setViewState('ready');
  }

  // Carregar Perifericos da API
  async function carregarPerifericos() {
    setViewState('loading');
    try {
      const data = await window.perifericosApi.listarPerifericos();
      perifericos = Array.isArray(data) ? data : [];
      renderPerifericos();
    } catch (err) {
      console.error(err);
      elements.stateErrorMessage.textContent =
        err.message || 'Nao foi possivel carregar os perifericos. Tente novamente.';
      setViewState('error');
    }
  }

  // Modal de Formulario: Abertura e Fechamento
  function limparErrosFormulario() {
    elements.errorModelo.textContent = '';
    elements.errorPreco.textContent = '';
    elements.errorFoto.textContent = '';
    elements.formGeneralError.textContent = '';
    elements.formGeneralError.classList.add('hidden');
  }

  function atualizarPreviewFoto(url) {
    elements.fotoPreviewBox.textContent = '';
    if (isValidHttpUrl(url)) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Pre-visualizacao';
      img.onerror = () => {
        elements.fotoPreviewBox.textContent = '';
        const span = document.createElement('span');
        span.className = 'preview-placeholder-text';
        span.textContent = 'URL de imagem inacessivel';
        elements.fotoPreviewBox.appendChild(span);
      };
      elements.fotoPreviewBox.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'preview-placeholder-text';
      span.textContent = 'Insira uma URL valida para pre-visualizar';
      elements.fotoPreviewBox.appendChild(span);
    }
  }

  function abrirModalCadastro() {
    limparErrosFormulario();
    elements.modalFormTitle.textContent = 'Cadastrar Periferico';
    elements.formId.value = '';
    elements.formMarca.value = 'Corsair';
    elements.formModelo.value = '';
    elements.formPreco.value = '';
    elements.formFoto.value = '';
    elements.btnSalvarTexto.textContent = 'Cadastrar';
    elements.btnSalvarForm.disabled = false;
    atualizarPreviewFoto('');

    elements.modalForm.classList.remove('hidden');
    elements.formModelo.focus();
  }

  function abrirModalEdicao(item) {
    limparErrosFormulario();
    elements.modalFormTitle.textContent = 'Editar Periferico';
    elements.formId.value = item._id;
    elements.formMarca.value = item.marca || 'Corsair';
    elements.formModelo.value = item.modelo || '';
    elements.formPreco.value = item.preco !== undefined ? item.preco : '';
    elements.formFoto.value = item.foto || '';
    elements.btnSalvarTexto.textContent = 'Salvar Alteracoes';
    elements.btnSalvarForm.disabled = false;
    atualizarPreviewFoto(item.foto || '');

    elements.modalForm.classList.remove('hidden');
    elements.formModelo.focus();
  }

  function fecharModalForm() {
    elements.modalForm.classList.add('hidden');
    limparErrosFormulario();
  }

  // Validacao do Formulario no Cliente
  function validarFormularioCliente() {
    limparErrosFormulario();
    let valido = true;

    const modelo = elements.formModelo.value.trim();
    if (!modelo) {
      elements.errorModelo.textContent = 'Informe o modelo do periferico.';
      valido = false;
    }

    const precoRaw = elements.formPreco.value;
    const precoNum = Number(precoRaw);
    if (precoRaw === '' || Number.isNaN(precoNum)) {
      elements.errorPreco.textContent = 'Informe um valor numerico valido.';
      valido = false;
    } else if (precoNum < 0) {
      elements.errorPreco.textContent = 'O preco deve ser maior ou igual a zero.';
      valido = false;
    }

    const foto = elements.formFoto.value.trim();
    if (!foto) {
      elements.errorFoto.textContent = 'Informe a URL da foto.';
      valido = false;
    } else if (!isValidHttpUrl(foto)) {
      elements.errorFoto.textContent = 'Informe uma URL valida (iniciando com http:// ou https://).';
      valido = false;
    }

    return valido;
  }

  // Submissao do Formulario
  async function onSubmitFormulario(e) {
    e.preventDefault();

    if (!validarFormularioCliente()) {
      return;
    }

    const id = elements.formId.value;
    const payload = {
      marca: 'Corsair',
      modelo: elements.formModelo.value.trim(),
      preco: Number(elements.formPreco.value),
      foto: elements.formFoto.value.trim(),
    };

    elements.btnSalvarForm.disabled = true;
    elements.btnSalvarTexto.textContent = id ? 'Salvando...' : 'Cadastrando...';

    try {
      if (id) {
        // Atualizar
        const atualizado = await window.perifericosApi.atualizarPeriferico(id, payload);
        const index = perifericos.findIndex((p) => p._id === id);
        if (index !== -1) {
          perifericos[index] = atualizado;
        } else {
          perifericos.unshift(atualizado);
        }
        showToast('Periferico atualizado com sucesso!', 'success');
      } else {
        // Criar
        const novo = await window.perifericosApi.cadastrarPeriferico(payload);
        perifericos.unshift(novo);
        showToast('Periferico cadastrado com sucesso!', 'success');
      }

      fecharModalForm();
      renderPerifericos();
    } catch (err) {
      console.error(err);
      elements.formGeneralError.textContent = err.message || 'Nao foi possivel salvar o periferico. Tente novamente.';
      elements.formGeneralError.classList.remove('hidden');
      showToast(err.message || 'Erro ao salvar o periferico.', 'error');
    } finally {
      elements.btnSalvarForm.disabled = false;
      elements.btnSalvarTexto.textContent = id ? 'Salvar Alteracoes' : 'Cadastrar';
    }
  }

  // Modal de Exclusao: Abertura e Fechamento
  function abrirModalExclusao(item) {
    itemParaExcluir = item;
    elements.confirmItemNome.textContent = item.modelo;
    elements.btnExcluirTexto.textContent = 'Excluir';
    elements.btnConfirmarExclusao.disabled = false;
    elements.modalConfirm.classList.remove('hidden');
  }

  function fecharModalExclusao() {
    itemParaExcluir = null;
    elements.modalConfirm.classList.add('hidden');
  }

  // Confirmar Exclusao
  async function onConfirmarExclusao() {
    if (!itemParaExcluir) return;

    const id = itemParaExcluir._id;
    elements.btnConfirmarExclusao.disabled = true;
    elements.btnExcluirTexto.textContent = 'Excluindo...';

    try {
      await window.perifericosApi.excluirPeriferico(id);
      perifericos = perifericos.filter((p) => p._id !== id);
      showToast('Periferico removido com sucesso!', 'success');
      fecharModalExclusao();
      renderPerifericos();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Nao foi possivel excluir o periferico.', 'error');
    } finally {
      elements.btnConfirmarExclusao.disabled = false;
      elements.btnExcluirTexto.textContent = 'Excluir';
    }
  }

  // Inicializacao dos Event Listeners
  function initEvents() {
    // Abertura de Modais
    elements.btnNovoPeriferico.addEventListener('click', abrirModalCadastro);
    elements.btnAdicionarPrimeiro.addEventListener('click', abrirModalCadastro);
    elements.btnRecarregar.addEventListener('click', carregarPerifericos);
    elements.btnTentarNovamente.addEventListener('click', carregarPerifericos);

    // Fechamento de Modais
    elements.btnFecharForm.addEventListener('click', fecharModalForm);
    elements.btnCancelarForm.addEventListener('click', fecharModalForm);

    elements.btnFecharConfirm.addEventListener('click', fecharModalExclusao);
    elements.btnCancelarExclusao.addEventListener('click', fecharModalExclusao);
    elements.btnConfirmarExclusao.addEventListener('click', onConfirmarExclusao);

    // Fechar ao clicar fora do modal
    elements.modalForm.addEventListener('click', (e) => {
      if (e.target === elements.modalForm) fecharModalForm();
    });
    elements.modalConfirm.addEventListener('click', (e) => {
      if (e.target === elements.modalConfirm) fecharModalExclusao();
    });

    // Submissao do Formulario
    elements.form.addEventListener('submit', onSubmitFormulario);

    // Preview dinamico de foto
    elements.formFoto.addEventListener('input', (e) => {
      atualizarPreviewFoto(e.target.value);
    });

    // Tecla ESC para fechar modais
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!elements.modalForm.classList.contains('hidden')) fecharModalForm();
        if (!elements.modalConfirm.classList.contains('hidden')) fecharModalExclusao();
      }
    });
  }

  // Inicializacao da Aplicacao
  function init() {
    initEvents();
    carregarPerifericos();
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
