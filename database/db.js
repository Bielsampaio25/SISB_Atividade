const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

// Resolução inteligente do caminho do banco:
// No Windows, se o diretório do projeto contiver acentos ou caracteres especiais (ex: 'manutenção'),
// a biblioteca nativa C do SQLite pode falhar ao abrir o arquivo. Nesse caso, usamos os.tmpdir() como fallback seguro.
function obterCaminhoBanco() {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  
  const diretorioPadrao = path.join(__dirname, 'sisb.db');
  const contemCaracteresEspeciais = /[^\x00-\x7F]/.test(path.resolve(__dirname));

  if (process.platform === 'win32' && contemCaracteresEspeciais) {
    const caminhoTemp = path.join(os.tmpdir(), 'sisb.db');
    console.log(`ℹ️ [SISB] Diretório do projeto contém caracteres especiais. Utilizando banco seguro em: ${caminhoTemp}`);
    return caminhoTemp;
  }

  return diretorioPadrao;
}

const DB_PATH = obterCaminhoBanco();

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco SQLite:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite:', DB_PATH);
  }
});

// Inicialização das tabelas se não existirem
function initDatabase() {
  db.serialize(() => {
    // 1. Tabela de Livros
    db.run(`
      CREATE TABLE IF NOT EXISTS livros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        autor TEXT NOT NULL,
        isbn TEXT,
        categoria TEXT,
        ano_publicacao INTEGER,
        status TEXT DEFAULT 'disponivel', -- 'disponivel' ou 'emprestado'
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tabela de Usuários (Leitores/Alunos)
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        matricula TEXT UNIQUE NOT NULL,
        telefone TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Tabela de Empréstimos
    db.run(`
      CREATE TABLE IF NOT EXISTS emprestimos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        livro_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        data_emprestimo TEXT NOT NULL,
        data_prevista_devolucao TEXT NOT NULL,
        data_devolucao TEXT,
        valor_multa REAL DEFAULT 0.0,
        renovacoes INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ativo', -- 'ativo' ou 'finalizado'
        FOREIGN KEY (livro_id) REFERENCES livros (id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )
    `);

    console.log('📦 Tabelas verificadas/criadas com sucesso.');
  });
}

initDatabase();

module.exports = db;
