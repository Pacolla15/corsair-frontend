/**
 * Modulo de comunicacao com a API REST de Perifericos Corsair
 */
(function (global) {
  'use strict';

  // Configure aqui a URL da sua API em producao apos o deploy (ex: 'https://sua-api.vercel.app/api')
  const PRODUCTION_API_URL = '';

  // Base URL dinamica
  const getBaseUrl = () => {
    if (global.API_BASE_URL) {
      return global.API_BASE_URL;
    }
    // Se aberto diretamente pelo sistema de arquivos (file://)
    if (global.location && global.location.protocol === 'file:') {
      return 'http://localhost:3000/api';
    }
    // Se rodando em porta diferente da API (ex: 5000) em localhost ou 127.0.0.1
    if (
      global.location &&
      (global.location.hostname === 'localhost' || global.location.hostname === '127.0.0.1') &&
      global.location.port !== '3000'
    ) {
      return 'http://localhost:3000/api';
    }
    return PRODUCTION_API_URL || '/api';
  };

  async function request(endpoint, options = {}) {
    const url = `${getBaseUrl()}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError) {
      throw new Error('Nao foi possivel conectar ao servidor da API. Verifique sua conexao ou se o servidor esta ativo.');
    }

    if (response.status === 204) {
      return null;
    }

    let body;
    try {
      body = await response.json();
    } catch (parseError) {
      if (!response.ok) {
        throw new Error(`Erro na requisicao (HTTP ${response.status})`);
      }
      return null;
    }

    if (!response.ok) {
      const mensagem = body && body.error ? body.error : `Erro na requisicao (HTTP ${response.status})`;
      throw new Error(mensagem);
    }

    return body;
  }

  const api = {
    async listarPerifericos() {
      const result = await request('/perifericos', { method: 'GET' });
      return result.data || [];
    },

    async obterPeriferico(id) {
      const result = await request(`/perifericos/${encodeURIComponent(id)}`, { method: 'GET' });
      return result.data;
    },

    async cadastrarPeriferico(dados) {
      const result = await request('/perifericos', {
        method: 'POST',
        body: JSON.stringify(dados),
      });
      return result.data;
    },

    async atualizarPeriferico(id, dados) {
      const result = await request(`/perifericos/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
      });
      return result.data;
    },

    async excluirPeriferico(id) {
      await request(`/perifericos/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    },
  };

  global.perifericosApi = api;
})(window);
