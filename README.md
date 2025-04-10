# 🗂️ Task Manager - Gerenciador de Tarefas

Este é um projeto de **Gerenciador de Tarefas** simples e funcional, construído com `PHP`, `MySQL`, `JavaScript`, `Bootstrap` e empacotado com `Docker Compose`. Ele permite `criar, listar, editar, excluir` por status, com uma interface moderna e responsiva.

---

## 🚀 Funcionalidades

- ✅ Criar tarefas com título, descrição e status
- 📝 Editar tarefas existentes
- ❌ Excluir tarefas
- 📊 Exibir estatísticas (quantas tarefas estão pendentes, em andamento e finalizadas)
- 🔄 Interface dinâmica (sem recarregamento de página)
- 📦 Implantação com Docker

---

## 📸 Preview

![preview](https://i.imgur.com/JotgjP2.png)

---

## 🧱 Tecnologias Utilizadas

- PHP 8.2 (com Apache)
- MySQL 8.0
- Bootstrap 5
- JavaScript (ES6)
- HTML5 + CSS3
- Docker & Docker Compose

---

## 📂 Estrutura do Projeto

```
.
├── docker-compose.yml
├── Dockerfile
├── sql-scripts/
│   └── init.sql
├── src/
│   ├── api.php
│   ├── index.html
│   ├── script.js
│   └── styles.css
```

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos

- [Docker](https://www.docker.com/) instalado
- [Docker Compose](https://docs.docker.com/compose/) instalado

> Recomendo usar o Docker Engine não precisamos de interface gráfica. :D

### Passos

1. Clone o repositório:

   ```bash
   git clone https://github.com/judhagsan/task-manager.git
   cd task-manager
   ```

2. Inicie os containers:

   ```bash
   docker-compose up -d --build
   ```

   > O `-d` vai rodar em modo `detach` para não prender seu terminal.

3. Acesse no navegador:
   ```
   http://localhost:9000
   ```

> Se aparecer esse aviso no canto direito inferior, espere um pouco e atualize a página, sua máquina ainda está subindo o banco de dados.  
> ![Aviso](https://i.imgur.com/V637TEE.png)

---

## 🛠️ API REST

A API está disponível via `/api.php/tasks` com os seguintes métodos:

| Método | Rota         | Descrição              |
| ------ | ------------ | ---------------------- |
| GET    | `/tasks`     | Lista todas as tarefas |
| GET    | `/tasks/:id` | Detalhes de uma tarefa |
| POST   | `/tasks`     | Cria uma nova tarefa   |
| PUT    | `/tasks/:id` | Atualiza uma tarefa    |
| DELETE | `/tasks/:id` | Remove uma tarefa      |

---

## 🧪 Exemplo de JSON

### Criar uma Tarefa (POST)

```json
{
  "title": "Estudar PHP",
  "description": "Revisar conceitos de API REST",
  "status": "pendente"
}
```

---

## 🗃️ Banco de Dados

O banco é inicializado automaticamente via script `init.sql`.

### Tabela: `tasks`

| Campo       | Tipo         |
| ----------- | ------------ |
| id          | INT (PK, AI) |
| title       | VARCHAR(255) |
| description | TEXT         |
| status      | ENUM         |
| created_at  | TIMESTAMP    |
| updated_at  | TIMESTAMP    |

---

## 📦 Variáveis de Ambiente

As seguintes variáveis são usadas no `docker-compose.yml`:

```yaml
DB_HOST: db
DB_NAME: todo_db
DB_USER: root
DB_PASS: root
```

Você pode alterá-las conforme necessário.

---

## 🧹 Limpeza

Para parar os containers e remover tudo:

```bash
docker-compose down -v
```

---
