const API_URL = '/api';

const form = document.getElementById('sighting-form');
const list = document.getElementById('sightings-list');
const searchInput = document.getElementById('search');
const submitBtn = document.getElementById('submit-btn');

// Guarda o id do avistamento sendo editado. null = modo "criar novo".
let editingId = null;

async function loadSightings(query = '') {
  const url = query
    ? `${API_URL}/avistamentos?q=${encodeURIComponent(query)}`
    : `${API_URL}/avistamentos`;
  const res = await fetch(url);
  const sightings = await res.json();

  list.innerHTML = '';

  if (sightings.length === 0) {
    list.innerHTML = '<li class="empty">Nenhum avistamento encontrado.</li>';
    return;
  }

  sightings.forEach((s) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <h3>${s.especie} — ${s.local}</h3>
      <p>${s.observacoes || ''}</p>
      <time>${new Date(s.avistado_em).toLocaleString('pt-BR')}</time>
      <div class="item-actions">
        <button class="edit-btn" data-id="${s.id}">Editar</button>
        <button class="delete-btn" data-id="${s.id}">Excluir</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// Cria (POST) ou atualiza (PUT), dependendo se estamos em modo edição
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const especie = document.getElementById('especie').value;
  const local = document.getElementById('local').value;
  const observacoes = document.getElementById('observacoes').value;

  if (editingId) {
    await fetch(`${API_URL}/avistamentos/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ especie, local, observacoes }),
    });
    exitEditMode();
  } else {
    await fetch(`${API_URL}/avistamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ especie, local, observacoes }),
    });
  }

  form.reset();
  loadSightings(searchInput.value);
});

// Delegação de eventos: um único listener na lista cobre editar/excluir
// de todos os itens, mesmo os que ainda vão ser criados depois.
list.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('delete-btn')) {
    if (!confirm('Excluir este avistamento?')) return;
    await fetch(`${API_URL}/avistamentos/${id}`, { method: 'DELETE' });
    loadSightings(searchInput.value);
  }

  if (e.target.classList.contains('edit-btn')) {
    const res = await fetch(`${API_URL}/avistamentos/${id}`);
    const sighting = await res.json();
    enterEditMode(sighting);
  }
});

function enterEditMode(sighting) {
  editingId = sighting.id;
  document.getElementById('especie').value = sighting.especie;
  document.getElementById('local').value = sighting.local;
  document.getElementById('observacoes').value = sighting.observacoes || '';
  submitBtn.textContent = 'Salvar edição';
  document.getElementById('especie').focus();
}

function exitEditMode() {
  editingId = null;
  submitBtn.textContent = 'Registrar avistamento';
}

// Busca em tempo real, com um pequeno debounce pra não disparar uma
// requisição a cada tecla digitada.
let debounceTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadSightings(searchInput.value), 300);
});

loadSightings();
