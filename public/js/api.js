// api.js - Módulo de comunicação com a API do SISB

const API = {
  // Livros
  async getLivros(busca = '') {
    const url = busca ? `/api/livros?busca=${encodeURIComponent(busca)}` : '/api/livros';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar livros');
    return await res.json();
  },

  async getLivro(id) {
    const res = await fetch(`/api/livros/${id}`);
    if (!res.ok) throw new Error('Erro ao buscar detalhes do livro');
    return await res.json();
  },

  async criarLivro(dados) {
    const res = await fetch('/api/livros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar livro');
    return json;
  },

  // Usuários
  async getUsuarios() {
    const res = await fetch('/api/usuarios');
    if (!res.ok) throw new Error('Erro ao carregar usuários');
    return await res.json();
  },

  async criarUsuario(dados) {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar usuário');
    return json;
  },

  // Empréstimos
  async getEmprestimos() {
    const res = await fetch('/api/emprestimos');
    if (!res.ok) throw new Error('Erro ao carregar empréstimos');
    return await res.json();
  },

  async criarEmprestimo(dados) {
    const res = await fetch('/api/emprestimos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao criar empréstimo');
    return json;
  },

  async devolverEmprestimo(id) {
    const res = await fetch(`/api/emprestimos/${id}/devolver`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao processar devolução');
    return json;
  },

  async renovarEmprestimo(id) {
    const res = await fetch(`/api/emprestimos/${id}/renovar`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao renovar empréstimo');
    return json;
  },

  // Estatísticas
  async getEstatisticas() {
    const res = await fetch('/api/estatisticas');
    if (!res.ok) throw new Error('Erro ao carregar métricas do sistema');
    return await res.json();
  }
};

// Funções globais de Modal
function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}
