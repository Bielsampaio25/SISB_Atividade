const db = require('./db');

function seedDatabase() {
  console.log('🌱 Populando banco de dados com registros didáticos...');

  db.serialize(() => {
    // Limpa dados existentes para garantir estado consistente
    db.run('DELETE FROM emprestimos');
    db.run('DELETE FROM usuarios');
    db.run('DELETE FROM livros');

    // Reset dos autoincrementos
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('livros', 'usuarios', 'emprestimos')");

    // 1. Inserir Livros
    const stmtLivro = db.prepare(`
      INSERT INTO livros (titulo, autor, isbn, categoria, ano_publicacao, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const livros = [
      ['Código Limpo: Habilidades Práticas do Agile Software', 'Robert C. Martin', '9788576082675', 'Engenharia de Software', 2009, 'emprestado'],
      ['O Programador Pragmático: De Aprendiz a Mestre', 'Andrew Hunt & David Thomas', '9788577807000', 'Programação', 2010, 'emprestado'],
      ['Refatoração: Aperfeiçoando o Design de Código Existente', 'Martin Fowler', '9788575227244', 'Manutenção de Software', 2019, 'disponivel'],
      ['Padrões de Projetos: Soluções Reutilizáveis', 'Erich Gamma et al.', '9788573076103', 'Arquitetura', 2000, 'disponivel'],
      ['Arquitetura Limpa: O Guia do Artesão para Estrutura', 'Robert C. Martin', '9788550804606', 'Arquitetura', 2018, 'disponivel'],
      ['Engenharia de Software: Uma Abordagem Profissional', 'Roger S. Pressman', '9788580555332', 'Engenharia de Software', 2016, 'disponivel'],
      ['Estruturas de Dados e Algoritmos com JavaScript', 'Loiane Groner', '9788575226933', 'Programação', 2019, 'disponivel'],
      ['Projeto de Banco de Dados', 'Carlos Alberto Heuser', '9788577804528', 'Banco de Dados', 2009, 'disponivel']
    ];

    livros.forEach((livro) => stmtLivro.run(livro));
    stmtLivro.finalize();

    // 2. Inserir Usuários (Alunos do SENAI)
    const stmtUsuario = db.prepare(`
      INSERT INTO usuarios (nome, email, matricula, telefone)
      VALUES (?, ?, ?, ?)
    `);

    const usuarios = [
      ['Lucas Silva', 'lucas.silva@aluno.senai.br', 'SENAI-202401', '(71) 98877-1122'],
      ['Mariana Santos', 'mariana.santos@aluno.senai.br', 'SENAI-202402', '(71) 98877-3344'],
      ['Gabriel Oliveira', 'gabriel.oliveira@aluno.senai.br', 'SENAI-202403', '(71) 98877-5566'],
      ['Beatriz Costa', 'beatriz.costa@aluno.senai.br', 'SENAI-202404', '(71) 98877-7788']
    ];

    usuarios.forEach((usuario) => stmtUsuario.run(usuario));
    stmtUsuario.finalize();

    // 3. Inserir Empréstimos (com datas relativas para demonstrar atraso e regularidade)
    const hoje = new Date();
    
    // Função auxiliar para formatar YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Empréstimo 1: Em atraso proposital (emprestado há 20 dias, vencido há 6 dias)
    const dataEmp1 = new Date();
    dataEmp1.setDate(hoje.getDate() - 20);
    const dataPrev1 = new Date();
    dataPrev1.setDate(hoje.getDate() - 6);

    // Empréstimo 2: Em andamento dentro do prazo (emprestado há 3 dias, vence em 4 dias)
    const dataEmp2 = new Date();
    dataEmp2.setDate(hoje.getDate() - 3);
    const dataPrev2 = new Date();
    dataPrev2.setDate(hoje.getDate() + 4);

    // Empréstimo 3: Já devolvido e finalizado anteriormente
    const dataEmp3 = new Date();
    dataEmp3.setDate(hoje.getDate() - 40);
    const dataPrev3 = new Date();
    dataPrev3.setDate(hoje.getDate() - 26);
    const dataDev3 = new Date();
    dataDev3.setDate(hoje.getDate() - 27); // Devolvido no prazo

    const stmtEmprestimo = db.prepare(`
      INSERT INTO emprestimos (livro_id, usuario_id, data_emprestimo, data_prevista_devolucao, data_devolucao, valor_multa, renovacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmtEmprestimo.run([1, 1, formatDate(dataEmp1), formatDate(dataPrev1), null, 0.0, 0, 'ativo']);
    stmtEmprestimo.run([2, 2, formatDate(dataEmp2), formatDate(dataPrev2), null, 0.0, 0, 'ativo']);
    stmtEmprestimo.run([3, 3, formatDate(dataEmp3), formatDate(dataPrev3), formatDate(dataDev3), 0.0, 0, 'finalizado']);
    stmtEmprestimo.finalize();

    console.log('✅ Banco de dados populado com sucesso!');
    console.log('📌 Exemplos criados:');
    console.log('   - Livro ID 1 (Código Limpo) está EMPRESTADO em ATRASO para Lucas Silva.');
    console.log('   - Livro ID 2 (O Programador Pragmático) está EMPRESTADO no prazo para Mariana Santos.');
    console.log('   - Livros 3 a 8 estão DISPONÍVEIS no catálogo.');
  });
}

// Executa caso chamado diretamente via `node database/seed.js` ou `npm run seed`
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
