// dashboard.js - Lógica da página inicial

document.addEventListener('DOMContentLoaded', () => {
  carregarDashboard();
});

async function carregarDashboard() {
  try {
    const stats = await API.getEstatisticas();
    
    // Atualiza cards
    document.getElementById('met-total-livros').textContent = stats.totalLivros;
    document.getElementById('met-sub-livros').textContent = `Disponíveis: ${stats.livrosDisponiveis} | Emprestados: ${stats.livrosEmprestados}`;
    
    document.getElementById('met-total-usuarios').textContent = stats.totalUsuarios;
    document.getElementById('met-emprestimos-ativos').textContent = stats.emprestimosAtivos;
    document.getElementById('met-atrasados').textContent = stats.emprestimosAtrasados;
    document.getElementById('met-multas').textContent = `Multas acumuladas: R$ ${Number(stats.multasAcumuladas).toFixed(2)}`;

    // Carrega tabela de pendências recentes
    const emprestimos = await API.getEmprestimos();
    const pendentes = emprestimos.filter(e => e.status === 'ativo').slice(0, 5);

    const tbody = document.getElementById('tabela-recentes');
    if (pendentes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--muted);">Nenhum empréstimo pendente no momento.</td></tr>';
      return;
    }

    const hojeStr = new Date().toISOString().split('T')[0];

    tbody.innerHTML = pendentes.map(emp => {
      const isAtrasado = emp.data_prevista_devolucao < hojeStr;
      const statusBadge = isAtrasado
        ? `<span class="badge badge-atrasado">Atrasado</span>`
        : `<span class="badge badge-emprestado">Em Andamento</span>`;

      return `
        <tr>
          <td>#${emp.id}</td>
          <td><strong>${escapeHtml(emp.livro_titulo)}</strong></td>
          <td>${escapeHtml(emp.usuario_nome)} <span style="font-size:0.8rem; color:var(--muted)">(${emp.usuario_matricula})</span></td>
          <td>${formatarDataBR(emp.data_emprestimo)}</td>
          <td>${formatarDataBR(emp.data_prevista_devolucao)}</td>
          <td>${statusBadge}</td>
          <td>
            <a href="emprestimos.html" class="btn btn-secondary btn-sm">Gerenciar</a>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '-';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
