const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// As credenciais vêm de variáveis de ambiente (definidas no docker-compose.yml),
// nunca ficam hardcoded no código.
const pool = new Pool({
  host: process.env.DB_HOST,       // nome do serviço no docker-compose, ex: "database"
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Espera o banco ficar pronto antes de tentar criar a tabela (retry simples)
async function initDb(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS avistamentos (
          id SERIAL PRIMARY KEY,
          especie TEXT NOT NULL,
          local TEXT NOT NULL,
          observacoes TEXT,
          avistado_em TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Conectado ao banco e tabela "avistamentos" pronta.');
      return;
    } catch (err) {
      console.log(`Banco ainda não disponível, tentando novamente... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.error('Não foi possível conectar ao banco depois de várias tentativas.');
}

// GET /avistamentos            -> lista todos
// GET /avistamentos?q=termo    -> filtra por espécie OU local contendo "termo"
app.get('/avistamentos', async (req, res) => {
  try {
    const { q } = req.query;
    let result;
    if (q && q.trim() !== '') {
      result = await pool.query(
        `SELECT * FROM avistamentos
         WHERE especie ILIKE $1 OR local ILIKE $1
         ORDER BY avistado_em DESC`,
        [`%${q}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM avistamentos ORDER BY avistado_em DESC');
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar avistamentos' });
  }
});

// GET /avistamentos/:id -> busca um avistamento específico
app.get('/avistamentos/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM avistamentos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avistamento não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar avistamento' });
  }
});

// POST /avistamentos -> registra um novo avistamento
app.post('/avistamentos', async (req, res) => {
  const { especie, local, observacoes } = req.body;
  if (!especie || !local) {
    return res.status(400).json({ error: 'especie e local são obrigatórios' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO avistamentos (especie, local, observacoes) VALUES ($1, $2, $3) RETURNING *',
      [especie, local, observacoes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar avistamento' });
  }
});

// PUT /avistamentos/:id -> atualiza um avistamento existente
app.put('/avistamentos/:id', async (req, res) => {
  const { especie, local, observacoes } = req.body;
  if (!especie || !local) {
    return res.status(400).json({ error: 'especie e local são obrigatórios' });
  }
  try {
    const result = await pool.query(
      `UPDATE avistamentos
       SET especie = $1, local = $2, observacoes = $3
       WHERE id = $4
       RETURNING *`,
      [especie, local, observacoes || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avistamento não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar avistamento' });
  }
});

// DELETE /avistamentos/:id -> remove um avistamento
app.delete('/avistamentos/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM avistamentos WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avistamento não encontrado' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir avistamento' });
  }
});

// Rota simples de healthcheck (útil para depuração do compose)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
  initDb();
});
