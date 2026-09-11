const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper de formatação de datas (YYYY-MM-DD)
const hojeFormatado = () => new Date().toISOString().split('T')[0];

// ==========================================
// ROTAS DE ESTATÍSTICAS (DASHBOARD)
// ==========================================
app.get('/api/estatisticas', (req, res) => {
  const hoje = hojeFormatado();

  const sqlLivros = "SELECT COUNT(*) as totalLivros, SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as disponiveis, SUM(CASE WHEN status = 'emprestado' THEN 1 ELSE 0 END) as emprestados FROM livros";
  const sqlUsuarios = "SELECT COUNT(*) as totalUsuarios FROM usuarios";
  const sqlEmprestimos = "SELECT COUNT(*) as totalAtivos FROM emprestimos WHERE status = 'ativo'";
  const sqlAtrasados = `SELECT COUNT(*) as totalAtrasados, IFNULL(SUM(valor_multa), 0) as multasAcumuladas FROM emprestimos WHERE status = 'ativo' AND data_prevista_devolucao < '${hoje}'`;

  db.get(sqlLivros, (err, rLivros) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get(sqlUsuarios, (err, rUsuarios) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get(sqlEmprestimos, (err, rEmp) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get(sqlAtrasados, (err, rAtrasos) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            totalLivros: rLivros.totalLivros || 0,
            livrosDisponiveis: rLivros.disponiveis || 0,
            livrosEmprestados: rLivros.emprestados || 0,
            totalUsuarios: rUsuarios.totalUsuarios || 0,
            emprestimosAtivos: rEmp.totalAtivos || 0,
            emprestimosAtrasados: rAtrasos.totalAtrasados || 0,
            multasAcumuladas: rAtrasos.multasAcumuladas || 0
          });
        });
      });
    });
  });
});

// ==========================================
// ROTAS DE LIVROS
// ==========================================

// Listar todos os livros ou filtrar por busca
app.get('/api/livros', (req, res) => {
  const termo = req.query.busca;

  if (termo) {
    // ⚠️ VULNERABILIDADE DIDÁTICA (PREV-01): Interpolação direta suscetível a SQL Injection!
    // Exercício de Manutenção Preventiva: os alunos devem refatorar para prepared statement parametrizado (?, ?, ?)
    const sqlVulneravel = `SELECT * FROM livros WHERE titulo LIKE '%${termo}%' OR autor LIKE '%${termo}%' OR categoria LIKE '%${termo}%' ORDER BY id DESC`;
    
    db.all(sqlVulneravel, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } else {
    db.all('SELECT * FROM livros ORDER BY id DESC', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

// Obter livro por ID
app.get('/api/livros/:id', (req, res) => {
  db.get('SELECT * FROM livros WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Livro não encontrado' });
    res.json(row);
  });
});

// Cadastrar novo livro
app.post('/api/livros', (req, res) => {
  const { titulo, autor, isbn, categoria, ano_publicacao } = req.body;

  // ⚠️ FALHA DIDÁTICA (CORR-03): Falta de validação consistente!
  // Permite cadastrar ano negativo, anos futuros absurdos (ex: ano 9999) ou títulos em branco
  if (!titulo || !autor) {
    return res.status(400).json({ error: 'Título e Autor são obrigatórios.' });
  }

  const sql = `
    INSERT INTO livros (titulo, autor, isbn, categoria, ano_publicacao, status)
    VALUES (?, ?, ?, ?, ?, 'disponivel')
  `;

  db.run(sql, [titulo, autor, isbn || null, categoria || 'Geral', ano_publicacao], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: this.lastID,
      titulo,
      autor,
      isbn,
      categoria,
      ano_publicacao,
      status: 'disponivel'
    });
  });
});

// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================

// Listar todos os usuários
app.get('/api/usuarios', (req, res) => {
  db.all('SELECT * FROM usuarios ORDER BY nome ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Cadastrar usuário
app.post('/api/usuarios', (req, res) => {
  const { nome, email, matricula, telefone } = req.body;

  if (!nome || !email || !matricula) {
    return res.status(400).json({ error: 'Nome, Email e Matrícula são obrigatórios.' });
  }

  const sql = 'INSERT INTO usuarios (nome, email, matricula, telefone) VALUES (?, ?, ?, ?)';
  db.run(sql, [nome, email, matricula, telefone || null], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Matrícula ou E-mail já cadastrado no sistema.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, nome, email, matricula, telefone });
  });
});

// ==========================================
// ROTAS DE EMPRÉSTIMOS E DEVOLUÇÕES
// ==========================================

// Listar empréstimos
app.get('/api/emprestimos', (req, res) => {
  const sql = `
    SELECT 
      e.id,
      e.livro_id,
      e.usuario_id,
      e.data_emprestimo,
      e.data_prevista_devolucao,
      e.data_devolucao,
      e.valor_multa,
      e.renovacoes,
      e.status,
      l.titulo as livro_titulo,
      l.autor as livro_autor,
      u.nome as usuario_nome,
      u.matricula as usuario_matricula
    FROM emprestimos e
    JOIN livros l ON e.livro_id = l.id
    JOIN usuarios u ON e.usuario_id = u.id
    ORDER BY e.id DESC
  `;

  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Realizar novo empréstimo
app.post('/api/emprestimos', (req, res) => {
  const { livro_id, usuario_id, dias = 7 } = req.body;

  if (!livro_id || !usuario_id) {
    return res.status(400).json({ error: 'Livro e Usuário são obrigatórios.' });
  }

  // Verifica se o livro está disponível
  db.get('SELECT * FROM livros WHERE id = ?', [livro_id], (err, livro) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!livro) return res.status(404).json({ error: 'Livro não encontrado.' });
    if (livro.status !== 'disponivel') {
      return res.status(400).json({ error: 'Este exemplar já se encontra emprestado.' });
    }

    const dataEmp = new Date();
    const dataPrev = new Date();
    dataPrev.setDate(dataEmp.getDate() + parseInt(dias, 10));

    // ⚠️ REGRA PARA MANUTENÇÃO ADAPTATIVA (ADAP-01):
    // Atualmente o sistema não considera finais de semana (sábado/domingo).
    // O chamado de manutenção adaptativa solicitará que se a data de devolução cair em fim de semana,
    // seja ajustada para a próxima segunda-feira útil!

    const dataEmpStr = dataEmp.toISOString().split('T')[0];
    const dataPrevStr = dataPrev.toISOString().split('T')[0];

    const sqlEmp = `
      INSERT INTO emprestimos (livro_id, usuario_id, data_emprestimo, data_prevista_devolucao, status)
      VALUES (?, ?, ?, ?, 'ativo')
    `;

    db.run(sqlEmp, [livro_id, usuario_id, dataEmpStr, dataPrevStr], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const novoId = this.lastID;

      // Atualiza o status do livro para 'emprestado'
      db.run('UPDATE livros SET status = ? WHERE id = ?', ['emprestado', livro_id], (errUp) => {
        if (errUp) return res.status(500).json({ error: errUp.message });
        res.status(201).json({
          id: novoId,
          livro_id,
          usuario_id,
          data_emprestimo: dataEmpStr,
          data_prevista_devolucao: dataPrevStr,
          status: 'ativo'
        });
      });
    });
  });
});

// Registrar Devolução de Empréstimo
app.post('/api/emprestimos/:id/devolver', (req, res) => {
  const emprestimoId = req.params.id;
  const hoje = hojeFormatado();

  db.get('SELECT * FROM emprestimos WHERE id = ?', [emprestimoId], (err, emp) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!emp) return res.status(404).json({ error: 'Empréstimo não encontrado.' });
    if (emp.status === 'finalizado') {
      return res.status(400).json({ error: 'Este empréstimo já foi finalizado anteriormente.' });
    }

    // ⚠️ BUG DIDÁTICO INTENCIONAL (CORR-01): Cálculo incorreto da multa por concatenação de String!
    // A taxa base é do tipo String ("5.00"). Ao somar com a taxa por dia, resulta em "5.0010" em vez de 15.00!
    // Além disso, há problemas com datas sem truncamento correto.
    let valorMulta = 0;
    const dataPrev = new Date(emp.data_prevista_devolucao + 'T00:00:00');
    const dataAtual = new Date(hoje + 'T00:00:00');

    const diffTempo = dataAtual.getTime() - dataPrev.getTime();
    const diasAtraso = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    if (diasAtraso > 0) {
      const taxaFixaProcessamento = "5.00"; // <-- STRING! ERRO PROPITAL
      const taxaDiaria = 2.00;
      // Erro: Concatena a string "5.00" com o cálculo de (diasAtraso * 2.00)
      valorMulta = taxaFixaProcessamento + (diasAtraso * taxaDiaria); 
    }

    // Atualiza o registro de empréstimo
    const sqlFinaliza = `
      UPDATE emprestimos 
      SET data_devolucao = ?, valor_multa = ?, status = 'finalizado'
      WHERE id = ?
    `;

    db.run(sqlFinaliza, [hoje, valorMulta, emprestimoId], (errFinaliza) => {
      if (errFinaliza) return res.status(500).json({ error: errFinaliza.message });

      // ⚠️ BUG DIDÁTICO INTENCIONAL (CORR-02):
      // O desenvolvedor original ESQUECEU de atualizar a tabela 'livros' de volta para 'disponivel'!
      // db.run("UPDATE livros SET status = 'disponivel' WHERE id = ?", [emp.livro_id]); <-- COMENTADO PROPOSITADAMENTE!
      
      res.json({
        mensagem: 'Livro devolvido com sucesso.',
        diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
        valorMulta: valorMulta,
        livro_id: emp.livro_id
      });
    });
  });
});

// ⚠️ FUNCIONALIDADE PARA MANUTENÇÃO EVOLUTIVA (EVOL-01):
// Rota de renovação ainda não implementada
app.post('/api/emprestimos/:id/renovar', (req, res) => {
  res.status(501).json({
    error: 'Funcionalidade não implementada',
    chamado: 'EVOL-01: Implementação do recurso de Renovação de Empréstimo',
    instrucao: 'Implementar a extensão de 7 dias na data prevista, respeitando limite de até 2 renovações e proibindo renovação de livros em atraso.'
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 SISB - Sistema de Biblioteca em execução!`);
  console.log(`📡 URL Local: http://localhost:${PORT}`);
  console.log(`📚 Disciplina: Manutenção de Sistemas - SENAI CIMATEC`);
  console.log('====================================================');
});
