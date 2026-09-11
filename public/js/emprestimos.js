// emprestimos.js - Lógica da gestão de empréstimos e devoluções

let listaEmprestimos = [];
let filtroAtual = 'todos';

document.addEventListener('DOMContentLoaded', () => {
  carregarEmprestimos();

  // Form de novo empréstimo
  const form = document.getElementById('form-novo-emprestimo');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await salvarEmprestimo();
  });

  // Botão de Exportar CSV (Exercício EVOL-03)
  const btnCsv = document.getElementById('btn-exportar-csv');
  btnCsv.addEventListener('click', () => {
    if (listaEmprestimos.length === 0) {
      alert('Nenhum dado disponível para exportação.');
      return;
    }

    // Exportação rápida de CSV no frontend para demonstrar o chamado EVOL-03
    const headers = ['ID', 'Livro', 'Leitor', 'Matricula', 'Data Emprestimo', 'Previsao Devolucao', 'Data Devolucao', 'Multa', 'Status'];
    const rows = listaEmprestimos.map(e => [
      e.id,
      `"${(e.livro_titulo || '').replace(/"/g, '""')}"`,
      `"${(e.usuario_nome || '').replace(/"/g, '""')}"`,
      e.usuario_matricula,
      e.data_emprestimo,
      e.data_prevista_devolucao,
      e.data_devolucao || '',
      e.valor_multa || 0,
      e.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_emprestimos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});

async function carregarEmprestimos() {
  const tbody = document.getElementById('tabela-emprestimos');
  try {
    listaEmprestimos = await API.getEmprestimos();
    renderizarTabela();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--danger); padding: 2rem;">Erro ao carregar registros: ${err.message}</td></tr>`;
  }
}

function filtrarStatus(tipo) {
  filtroAtual = tipo;
  renderizarTabela();
}

function renderizarTabela() {
  const tbody = document.getElementById('tabela-emprestimos');
  const contador = document.getElementById('contador-emprestimos');
  const hojeStr = new Date().toISOString().split('T')[0];

  let dadosFiltrados = listaEmprestimos;

  if (filtroAtual === 'ativos') {
    dadosFiltrados = listaEmprestimos.filter(e => e.status === 'ativo');
  } else if (filtroAtual === 'atrasados') {
    dadosFiltrados = listaEmprestimos.filter(e => e.status === 'ativo' && e.data_prevista_devolucao < hojeStr);
  } else if (filtroAtual === 'finalizados') {
    dadosFiltrados = listaEmprestimos.filter(e => e.status === 'finalizado');
  }

  contador.textContent = `Exibindo ${dadosFiltrados.length} de ${listaEmprestimos.length} registros`;

  if (dadosFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--muted); padding: 2rem;">Nenhum registro encontrado para este filtro.</td></tr>';
    return;
  }

  tbody.innerHTML = dadosFiltrados.map(emp => {
    const isAtivo = emp.status === 'ativo';
    const isAtrasado = isAtivo && emp.data_prevista_devolucao < hojeStr;

    let statusBadge = '';
    if (!isAtivo) {
      statusBadge = '<span class="badge badge-finalizado">Devolvido</span>';
    } else if (isAtrasado) {
      statusBadge = '<span class="badge badge-atrasado">Atrasado</span>';
    } else {
      statusBadge = '<span class="badge badge-emprestado">Em Andamento</span>';
    }

    // Formatação da multa (para evidenciar o bug CORR-01 quando for string com valor estranho)
    const multaFormatada = emp.valor_multa 
      ? `R$ ${emp.valor_multa}` 
      : 'R$ 0,00';

    return `
      <tr>
        <td><strong>#${emp.id}</strong></td>
        <td><strong>${escapeHtml(emp.livro_titulo)}</strong></td>
        <td>${escapeHtml(emp.usuario_nome)} <span style="font-size:0.8rem; color:var(--muted)">(${emp.usuario_matricula})</span></td>
        <td>${formatarDataBR(emp.data_emprestimo)}</td>
        <td><strong>${formatarDataBR(emp.data_prevista_devolucao)}</strong></td>
        <td>${formatarDataBR(emp.data_devolucao)}</td>
        <td style="color: ${emp.valor_multa > 0 ? 'var(--danger)' : 'inherit'}; font-weight: 600;">${multaFormatada}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right; white-space: nowrap;">
          ${isAtivo ? `
            <!-- Botão de Renovar (EVOL-01) -->
            <button class="btn btn-secondary btn-sm" onclick="tentarRenovar(${emp.id})" title="Renovar por mais 7 dias">Renovar</button>
            <!-- Botão de Devolver (CORR-01 e CORR-02) -->
            <button class="btn btn-success btn-sm" onclick="confirmarDevolucao(${emp.id})">Devolver</button>
          ` : '<span style="color:var(--muted); font-size:0.8rem;">Concluído</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

async function abrirModalNovoEmprestimo() {
  try {
    const [usuarios, livros] = await Promise.all([
      API.getUsuarios(),
      API.getLivros()
    ]);

    const selectUsuario = document.getElementById('select-usuario');
    selectUsuario.innerHTML = '<option value="">Selecione o leitor...</option>' + 
      usuarios.map(u => `<option value="${u.id}">${escapeHtml(u.nome)} (${u.matricula})</option>`).join('');

    const livrosDisponiveis = livros.filter(l => l.status === 'disponivel');
    const selectLivro = document.getElementById('select-livro');
    selectLivro.innerHTML = '<option value="">Selecione um livro disponível...</option>' + 
      livrosDisponiveis.map(l => `<option value="${l.id}">${escapeHtml(l.titulo)} - ${escapeHtml(l.autor)}</option>`).join('');

    if (livrosDisponiveis.length === 0) {
      alert('Aviso: Não há livros disponíveis no momento para empréstimo.');
    }

    abrirModal('modal-novo-emprestimo');
  } catch (err) {
    alert('Erro ao carregar dados do formulário: ' + err.message);
  }
}

async function salvarEmprestimo() {
  const livro_id = document.getElementById('select-livro').value;
  const usuario_id = document.getElementById('select-usuario').value;
  const dias = document.getElementById('input-dias').value;

  if (!livro_id || !usuario_id) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  try {
    await API.criarEmprestimo({ livro_id, usuario_id, dias });
    alert('Empréstimo registrado com sucesso!');
    fecharModal('modal-novo-emprestimo');
    carregarEmprestimos();
  } catch (err) {
    alert('Erro ao registrar empréstimo: ' + err.message);
  }
}

async function confirmarDevolucao(id) {
  if (!confirm(`Deseja confirmar a devolução do empréstimo #${id}?`)) return;

  try {
    const resultado = await API.devolverEmprestimo(id);
    let msg = `Devolução registrada com sucesso!\nDias de atraso: ${resultado.diasAtraso}`;
    if (resultado.diasAtraso > 0) {
      // Aqui o aluno perceberá o bug da multa (CORR-01)
      msg += `\n⚠️ Multa aplicada: R$ ${resultado.valorMulta}`;
    }
    alert(msg);
    carregarEmprestimos();
  } catch (err) {
    alert('Erro ao devolver: ' + err.message);
  }
}

async function tentarRenovar(id) {
  try {
    const res = await API.renovarEmprestimo(id);
    alert(res.mensagem || 'Renovado com sucesso!');
    carregarEmprestimos();
  } catch (err) {
    // Alerta informando o chamado didático
    alert(`[Chamado EVOL-01]\n${err.message}`);
  }
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '-';
  const partes = dataISO.split('-');
  if (partes.length < 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
