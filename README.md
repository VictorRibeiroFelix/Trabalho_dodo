# Trabalho Prático — App em 3 Contêineres (Frontend + Backend + Banco)

## Tema: Registro de Avistamento de Pássaros

Página minimalista para registrar e listar avistamentos de pássaros: espécie,
local e observações, com data/hora automática.

## Arquitetura

```
[ Navegador ]
      |
      v  (porta 8080, publicada no host)
[ frontend ]  --- Nginx servindo HTML/CSS/JS estático
      |
      v  fetch() do JS para http://localhost:3000 (porta 3000, publicada no host)
[ backend ]   --- Node.js + Express, API REST de avistamentos
      |
      v  driver "pg", usando o nome do serviço "database" (rede interna do Compose)
[ database ]  --- PostgreSQL, dados persistidos em volume nomeado
```

Ponto importante: a comunicação **frontend → backend** acontece pelo
**navegador do usuário**, então usa a porta publicada no host
(`localhost:3000`). Já a comunicação **backend → database** acontece
**dentro da rede interna do Docker**, então usa o nome do serviço
(`database`) — é o Compose quem resolve esse nome via DNS interno.

## Estrutura de pastas

```
trabalho-docker/
├── docker-compose.yml       # orquestra os 3 serviços
├── database/
│   └── init.sql             # cria a tabela "avistamentos" na primeira subida
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js            # API: GET/POST /avistamentos
│   └── .env.example
└── frontend/
    ├── Dockerfile
    ├── nginx/default.conf
    ├── index.html
    ├── style.css
    └── script.js
```

## Modelo de dados

Tabela `avistamentos`:

| Campo         | Tipo      | Descrição                          |
|---------------|-----------|-------------------------------------|
| id            | SERIAL    | Identificador do avistamento        |
| especie       | TEXT      | Espécie observada (obrigatório)     |
| local         | TEXT      | Local do avistamento (obrigatório)  |
| observacoes   | TEXT      | Comportamento, quantidade, etc.     |
| avistado_em   | TIMESTAMP | Data/hora do registro (automática)  |

## Endpoints da API

| Método | Rota | O que faz |
|---|---|---|
| GET | `/avistamentos` | Lista todos os avistamentos |
| GET | `/avistamentos?q=termo` | Filtra por espécie ou local contendo "termo" |
| GET | `/avistamentos/:id` | Busca um avistamento específico |
| POST | `/avistamentos` | Cria um novo avistamento |
| PUT | `/avistamentos/:id` | Atualiza um avistamento existente |
| DELETE | `/avistamentos/:id` | Remove um avistamento |

CRUD completo: Create, Read, Update, Delete.

## Como executar

Dentro da pasta `trabalho-docker/`:

```bash
docker compose up --build
```

(se estiver usando Podman: `podman compose up --build`)

Depois:
- Frontend: http://localhost:8080
- API direto: http://localhost:3000/avistamentos
- Banco (se quiser inspecionar com um client): localhost:5432, user `appuser`, senha `apppassword`, db `avistamentosdb`

Para parar:
```bash
docker compose down
```

Para parar E apagar os dados do banco (reseta o volume):
```bash
docker compose down -v
```

## Conceitos aplicados (ligando com a proposta do trabalho)

- **Dockerfile**: um para o `backend` (Node.js) e outro para o `frontend`
  (build de contexto estático + Nginx).
- **Compose**: `docker-compose.yml` define os 3 serviços, suas portas,
  variáveis de ambiente, dependências (`depends_on` + `healthcheck`) e
  volumes.
- **Rede de contêineres**: o Compose cria automaticamente uma rede padrão;
  o backend acessa o banco pelo nome `database` sem precisar saber o IP.
- **Volumes**: `db-data` é um volume nomeado — os dados do Postgres
  sobrevivem a `docker compose down` (só somem com `down -v`).
- **Variáveis de ambiente**: credenciais do banco (`DB_USER`,
  `DB_PASSWORD`, etc.) são passadas via `environment:` no compose, nunca
  hardcoded no `server.js`.

## Possíveis extensões (se quiser ir além do mínimo)

- Campo de foto (upload) do avistamento, armazenado em volume separado.
- Usar um arquivo `.env` + `env_file:` no compose em vez de valores
  hardcoded no `docker-compose.yml` (mais próximo do "certo" em produção).
- Adicionar um serviço `pgadmin` para inspecionar o banco visualmente.
