// livros.js - Lógica do Catálogo de Livros

document.addEventListener('DOMContentLoaded', () => {
  carregarLivros();

  // Busca de livros
  const inputBusca = document.getElementById('campo-busca');
  let timeoutBusca = null;
  inputBusca.addEventListener('input', (e) => {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(() => {
      carregarLivros(e.target.value.trim());
    }, 300);
  });

  // Cadastro de novo livro
  const formLivro = document.getElementById('form-novo-livro');
  formLivro.addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarLivro();
  });

  // Botão de busca por ISBN (Exercício ADAP-02)
  const btnIsbn = document.getElementById('btn-buscar-isbn');
  btnIsbn.addEventListener('click', async () => {
    const isbn = document.getElementById('livro-isbn').value.trim().replace(/[-\s]/g, '');
    if (!isbn) {
      alert('Por favor, informe um código ISBN primeiro.');
      return;
    }

    btnIsbn.textContent = 'Buscando...';
    btnIsbn.disabled = true;

    try {
      // Chamada à API pública da Open Library (exercício de Manutenção Adaptativa)
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (!res.ok) throw new Error('Livro não localizado na base Open Library.');
      const data = await res.json();

      document.getElementById('livro-titulo').value = data.title || '';
      
      // Se houver ano de publicação
      if (data.publish_date) {
        const ano = data.publish_date.match(/\d{4}/);
        if (ano) document.getElementById('livro-ano').value = ano[0];
      }

      alert('Dados recuperados via API com sucesso! Complete os campos restantes.');
    } catch (err) {
      alert('Não foi possível obter dados automáticos para este ISBN: ' + err.message);
    } finally {
      btnIsbn.textContent = 'Buscar';
      btnIsbn.disabled = false;
    }
  });
});

async function carregarLivros(termo = '') {
  const tbody = document.getElementById('tabela-livros');
  try {
    const livros = await API.getLivros(termo);

    if (livros.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 2rem;">Nenhum livro encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = livros.map(livro => {
      const statusBadge = livro.status === 'disponivel'
        ? `<span class="badge badge-disponivel">Disponível</span>`
        : `<span class="badge badge-emprestado">Emprestado</span>`;

      return `
        <tr>
          <td><strong>#${livro.id}</strong></td>
          <td><strong>${escapeHtml(livro.titulo)}</strong></td>
          <td>${escapeHtml(livro.autor)}</td>
          <td><code>${livro.isbn || '-'}</code></td>
          <td>${escapeHtml(livro.categoria || 'Geral')}</td>
          <td>${livro.ano_publicacao || '-'}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Erro ao carregar livros:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--danger); padding: 1.5rem;">Erro ao carregar livros: ${err.message}</td></tr>`;
  }
}

async function salvarLivro() {
  const dados = {
    titulo: document.getElementById('livro-titulo').value.trim(),
    autor: document.getElementById('livro-autor').value.trim(),
    isbn: document.getElementById('livro-isbn').value.trim(),
    categoria: document.getElementById('livro-categoria').value.trim(),
    ano_publicacao: document.getElementById('livro-ano').value ? parseInt(document.getElementById('livro-ano').value, 10) : null
  };

  try {
    await API.criarLivro(dados);
    alert('Livro cadastrado com sucesso!');
    document.getElementById('form-novo-livro').reset();
    fecharModal('modal-novo-livro');
    carregarLivros();
  } catch (err) {
    alert('Erro ao salvar livro: ' + err.message);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
