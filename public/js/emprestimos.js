// emprestimos.js - Lógica da gestão de empréstimos e devoluções

// Deve ser igual à tarifa definida no backend/SISB.
const VALOR_MULTA_POR_DIA = 1.00;

let listaEmprestimos = [];
let filtroAtual = 'todos';

document.addEventListener('DOMContentLoaded', () => {
  carregarEmprestimos();

  const form = document.getElementById('form-novo-emprestimo');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await salvarEmprestimo();
    });
  }

  const btnCsv = document.getElementById('btn-exportar-csv');
  if (btnCsv) {
    btnCsv.addEventListener('click', exportarCsv);
  }
});

function exportarCsv() {
  if (listaEmprestimos.length === 0) {
    alert('Nenhum dado disponível para exportação.');
    return;
  }

  const headers = ['ID', 'Livro', 'Leitor', 'Matricula', 'Data Emprestimo', 'Previsao Devolucao', 'Data Devolucao', 'Multa', 'Status'];
  const rows = listaEmprestimos.map(e => [
    e.id,
    `"${String(e.livro_titulo || '').replace(/"/g, '""')}"`,
    `"${String(e.usuario_nome || '').replace(/"/g, '""')}"`,
    e.usuario_matricula || '',
    e.data_emprestimo || '',
    e.data_prevista_devolucao || '',
    e.data_devolucao || '',
    normalizarMulta(e.valor_multa),
    e.status || ''
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `relatorio_emprestimos_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function carregarEmprestimos() {
  const tbody = document.getElementById('tabela-emprestimos');
  try {
    listaEmprestimos = await API.getEmprestimos();
    renderizarTabela();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--danger); padding: 2rem;">Erro ao carregar registros: ${escapeHtml(err.message)}</td></tr>`;
    }
  }
}

function filtrarStatus(tipo) {
  filtroAtual = tipo;
  renderizarTabela();
}

function renderizarTabela() {
  const tbody = document.getElementById('tabela-emprestimos');
  const contador = document.getElementById('contador-emprestimos');
  if (!tbody || !contador) return;

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
    const multa = normalizarMulta(emp.valor_multa);

    let statusBadge = '';
    if (!isAtivo) {
      statusBadge = '<span class="badge badge-finalizado">Devolvido</span>';
    } else if (isAtrasado) {
      statusBadge = '<span class="badge badge-atrasado">Atrasado</span>';
    } else {
      statusBadge = '<span class="badge badge-emprestado">Em Andamento</span>';
    }

    return `
      <tr>
        <td><strong>#${escapeHtml(emp.id)}</strong></td>
        <td><strong>${escapeHtml(emp.livro_titulo)}</strong></td>
        <td>${escapeHtml(emp.usuario_nome)} <span style="font-size:0.8rem; color:var(--muted)">(${escapeHtml(emp.usuario_matricula)})</span></td>
        <td>${formatarDataBR(emp.data_emprestimo)}</td>
        <td><strong>${formatarDataBR(emp.data_prevista_devolucao)}</strong></td>
        <td>${formatarDataBR(emp.data_devolucao)}</td>
        <td style="color: ${multa > 0 ? 'var(--danger)' : 'inherit'}; font-weight: 600;">${formatarMoedaBR(multa)}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right; white-space: nowrap;">
          ${isAtivo ? `
            <button class="btn btn-secondary btn-sm" onclick="tentarRenovar(${Number(emp.id)})" title="Renovar por mais 7 dias">Renovar</button>
            <button class="btn btn-success btn-sm" onclick="confirmarDevolucao(${Number(emp.id)})">Devolver</button>
          ` : '<span style="color:var(--muted); font-size:0.8rem;">Concluído</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

async function abrirModalNovoEmprestimo() {
  try {
    const [usuarios, livros] = await Promise.all([API.getUsuarios(), API.getLivros()]);
    const selectUsuario = document.getElementById('select-usuario');
    const selectLivro = document.getElementById('select-livro');
    const livrosDisponiveis = livros.filter(l => l.status === 'disponivel');

    selectUsuario.innerHTML = '<option value="">Selecione o leitor...</option>' +
      usuarios.map(u => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.nome)} (${escapeHtml(u.matricula)})</option>`).join('');
    selectLivro.innerHTML = '<option value="">Selecione um livro disponível...</option>' +
      livrosDisponiveis.map(l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.titulo)} - ${escapeHtml(l.autor)}</option>`).join('');

    if (livrosDisponiveis.length === 0) alert('Aviso: Não há livros disponíveis no momento para empréstimo.');
    abrirModal('modal-novo-emprestimo');
  } catch (err) {
    alert('Erro ao carregar dados do formulário: ' + err.message);
  }
}

async function salvarEmprestimo() {
  const livro_id = document.getElementById('select-livro').value;
  const usuario_id = document.getElementById('select-usuario').value;
  const dias = Number(document.getElementById('input-dias').value);

  if (!livro_id || !usuario_id || !Number.isInteger(dias) || dias <= 0) {
    alert('Preencha os campos obrigatórios e indique um número de dias válido.');
    return;
  }

  try {
    await API.criarEmprestimo({ livro_id, usuario_id, dias });
    alert('Empréstimo registrado com sucesso!');
    fecharModal('modal-novo-emprestimo');
    await carregarEmprestimos();
  } catch (err) {
    alert('Erro ao registrar empréstimo: ' + err.message);
  }
}

async function confirmarDevolucao(id) {
  if (!confirm(`Deseja confirmar a devolução do empréstimo #${id}?`)) return;

  try {
    const resultado = await API.devolverEmprestimo(id);
    const diasAtraso = Math.max(0, Number(resultado.diasAtraso) || 0);
    const valorMulta = normalizarMulta(resultado.valorMulta);
    let msg = `Devolução registrada com sucesso!\nDias de atraso: ${diasAtraso}`;

    if (diasAtraso > 0) {
      msg += `\n⚠️ Multa aplicada: ${formatarMoedaBR(valorMulta)}`;
    }

    alert(msg);
    await carregarEmprestimos();
  } catch (err) {
    alert('Erro ao devolver: ' + err.message);
  }
}

async function tentarRenovar(id) {
  try {
    const res = await API.renovarEmprestimo(id);
    alert(res.mensagem || 'Renovado com sucesso!');
    await carregarEmprestimos();
  } catch (err) {
    alert(`[Chamado EVOL-01]\n${err.message}`);
  }
}

function normalizarMulta(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? Number(numero.toFixed(2)) : 0;
}

function calcularMulta(diasAtraso, valorPorDia = VALOR_MULTA_POR_DIA) {
  const dias = Math.max(0, Number(diasAtraso) || 0);
  const tarifa = Math.max(0, Number(valorPorDia) || 0);
  return normalizarMulta(dias * tarifa);
}

function formatarMoedaBR(valor) {
  return normalizarMulta(valor).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '-';
  const partes = String(dataISO).split('-');
  if (partes.length < 3) return String(dataISO);
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
