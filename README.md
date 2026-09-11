# SISB - Sistema de Informação de Biblioteca 📚
> **Projeto Prático para a Disciplina de Manutenção de Sistemas**  
> **SENAI CIMATEC** — Engenharia e Desenvolvimento de Software

Bem-vindo ao repositório do **SISB**, um sistema web concebido para simular um ambiente corporativo de sustentação e evolução de software legado.

Durante esta disciplina, você e sua equipe atuarão como engenheiros de software responsáveis por atender a chamados de sustentação técnica, atuando nos quatro pilares fundamentais da manutenção de software:
1. **Manutenção Corretiva:** Correção de bugs, falhas de lógica e inconsistências em produção.
2. **Manutenção Evolutiva:** Desenvolvimento de novos requisitos solicitados pelos usuários.
3. **Manutenção Adaptativa:** Ajustes a mudanças de regras institucionais e integração com APIs externas.
4. **Manutenção Preventiva / Perfectiva:** Refatoração de arquitetura, eliminação de vulnerabilidades de segurança e adição de testes.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5 semântico, CSS3 (design system moderno e responsivo) e JavaScript Vanilla (Fetch API).
* **Backend:** Node.js com Express.
* **Banco de Dados:** SQLite (arquivo local `database/sisb.db`). Não requer instalação de SGBD externo.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
* Ter o **Node.js** (versão 18 ou superior) instalado em sua máquina.
* Ter o **Git** instalado e configurado.

### 2. Instalação e Inicialização
No terminal da pasta do projeto, execute:

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Popular o banco de dados com os dados iniciais de teste
npm run seed

# 3. Iniciar o servidor
npm start
```

Após iniciar, acesse o sistema no seu navegador em:  
👉 **http://localhost:3000**

---

## 🔄 Fluxo de Trabalho e Prática de Versionamento (Git/GitHub)

Todas as tarefas de manutenção devem seguir o fluxo profissional de Pull Request:

```text
Repositório Central (Professor)
          │
          ▼ [Fork]
Repositório Pessoal (Aluno/Grupo)
          │
          ▼ [git checkout -b fix/nome-da-branch]
Desenvolvimento & Testes Locais
          │
          ▼ [git commit -m "tipo: mensagem descritiva"]
Push para o Fork
          │
          ▼ [Pull Request]
Avaliação & Revisão de Código pelo Professor
```

### 1. Fazer Fork
Faça o *Fork* deste repositório para o seu perfil no GitHub.

### 2. Criar uma Branch Específica para o Chamado
Nunca trabalhe diretamente na branch `main`. Crie uma branch nomeada de acordo com o tipo de manutenção:

* Para **Manutenção Corretiva**: `git checkout -b fix/corr-01-calculo-multa`
* Para **Manutenção Evolutiva**: `git checkout -b feat/evol-01-renovacao-emprestimo`
* Para **Manutenção Adaptativa**: `git checkout -b chore/adap-01-regras-dias-uteis`
* Para **Manutenção Preventiva/Perfectiva**: `git checkout -b refactor/prev-01-sql-injection`

### 3. Padrão de Commits Semânticos
Utilize mensagens claras e padronizadas:
* `fix: corrige soma de tipos no calculo da multa por atraso`
* `feat: implementa rota e modal de renovacao de emprestimo`
* `refactor: parametriza consultas SQL prevenindo injection`
* `test: adiciona testes unitarios para prazos de devolucao`

### 4. Abertura do Pull Request (PR)
Abra um Pull Request direcionado para o repositório principal com as seguintes informações:
1. **Número e Título do Chamado** atendido.
2. **Diagnóstico da Causa-Raiz** (o que estava provocando o problema ou por que a alteração era necessária).
3. **Descrição da Solução Técnica** (quais arquivos foram modificados e como).
4. **Evidência de Teste** (print da tela, log do terminal ou resultado de teste).

---

## 📋 Catálogo de Chamados

Consulte o arquivo [`BACKLOG_CHAMADOS.md`](file:///c:/Users/allan/OneDrive/Documentos/aula/senai/manuten%C3%A7%C3%A3o%20de%20sistemas/exercicio%20pratico/SISB/BACKLOG_CHAMADOS.md) para a lista completa de chamados técnicos disponíveis para resolução.

---

## 🏛️ Organização das Pastas

```text
SISB/
├── .github/
│   └── ISSUE_TEMPLATE/       # Templates padronizados para chamados
├── database/
│   ├── db.js                 # Conexão e criação das tabelas SQLite
│   ├── seed.js               # Carga inicial de dados didáticos
│   └── sisb.db               # Arquivo gerado do banco de dados
├── public/                   # Interface Web (Frontend)
│   ├── css/style.css         # Estilização moderna
│   ├── js/                   # Scripts de tela e cliente API
│   ├── index.html            # Dashboard principal
│   ├── livros.html           # Catálogo e cadastro de exemplares
│   ├── emprestimos.html      # Gestão de circulação e devoluções
│   └── usuarios.html         # Gestão de alunos e leitores
├── server.js                 # Servidor Express com APIs REST
├── package.json              # Configurações do projeto Node.js
├── README.md                 # Este guia de orientação
├── BACKLOG_CHAMADOS.md       # Catálogo de tarefas práticas
└── GABARITO_PROFESSOR.md     # Guia técnico de suporte ao instrutor
```
