// usuarios.js - Lógica da gestão de leitores e usuários

document.addEventListener('DOMContentLoaded', () => {
  carregarUsuarios();

  const form = document.getElementById('form-novo-usuario');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarUsuario();
  });
});

async function carregarUsuarios() {
  const tbody = document.getElementById('tabela-usuarios');
  try {
    const usuarios = await API.getUsuarios();

    if (usuarios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--muted); padding: 2rem;">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    tbody.innerHTML = usuarios.map(u => `
      <tr>
        <td><strong>#${u.id}</strong></td>
        <td><strong>${escapeHtml(u.nome)}</strong></td>
        <td><code>${escapeHtml(u.matricula)}</code></td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.telefone || '-')}</td>
        <td>${u.criado_em ? u.criado_em.split(' ')[0] : '-'}</td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 2rem;">Erro ao carregar usuários: ${err.message}</td></tr>`;
  }
}

async function salvarUsuario() {
  const dados = {
    nome: document.getElementById('usuario-nome').value.trim(),
    matricula: document.getElementById('usuario-matricula').value.trim(),
    email: document.getElementById('usuario-email').value.trim(),
    telefone: document.getElementById('usuario-telefone').value.trim()
  };

  try {
    await API.criarUsuario(dados);
    alert('Leitor cadastrado com sucesso!');
    document.getElementById('form-novo-usuario').reset();
    fecharModal('modal-novo-usuario');
    carregarUsuarios();
  } catch (err) {
    alert('Erro ao cadastrar: ' + err.message);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
