// ─── Utilidades ────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const goto = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
const vars = (p) => `--c:${p.color};--a:${p.accent};--g:${p.glow}`;

// ─── Render ────────────────────────────────────────────────────────────────
function renderMiniList(trio) {
  $('mini-list').innerHTML = trio.map(p => `
    <button class="mini-btn" data-goto="${p.id}" style="${vars(p)}">
      <img src="${p.img}" alt="${p.name}" />
      <div><p class="mini-name">${p.name}</p><p class="mini-domain">${p.domain}</p></div>
    </button>`).join('');
}

function renderCards(trio) {
  $('cards').innerHTML = trio.map(p => `
    <button class="poke-card" data-goto="${p.id}" style="${vars(p)}">
      <img src="${p.img}" alt="${p.name}" />
      <span class="name">${p.name}</span>
      <span class="domain">${p.domain}</span>
    </button>`).join('');
}

function renderPokemon(p) {
  const stats = Object.entries(p.stats).map(([k, v]) => `
    <div class="stat">
      <span class="stat-name">${k}</span>
      <span class="stat-val">${v}</span>
      <div class="stat-track"><div class="stat-fill" style="width:${(v / 255) * 100}%"></div></div>
    </div>`).join('');

  return `
    <section id="${p.id}" class="poke-section" style="${vars(p)}">
      <div class="poke-head">
        <div class="poke-bar"></div>
        <div>
          <p class="label poke-num">#${p.num} — ${p.domain}</p>
          <h2 class="poke-name">${p.name}</h2>
          <p class="poke-title">${p.title}</p>
        </div>
      </div>
      <div class="types">${p.types.map(t => `<span class="type-pill">${t}</span>`).join('')}</div>
      <div class="poke-grid">
        <div class="poke-img"><img src="${p.img}" alt="${p.name}" /></div>
        <div class="poke-info">
          <div class="box"><p class="label">Pokédex Entry</p><p class="dex">${p.dex}</p></div>
          <div class="box"><p class="label">Base Stats</p><div class="stats">${stats}</div></div>
        </div>
      </div>
      <div class="lore-box"><p class="label">Ancient Lore</p><p>${p.lore}</p></div>
    </section>`;
}

function renderPokemonSections(trio) {
  $('pokemon-sections').innerHTML = trio.map(renderPokemon).join('');
}

function renderSideTypes(trio) {
  $('side-types').innerHTML = trio.map(p => `
    <div class="side-type" style="${vars(p)}">
      <p class="side-type-name">${p.name}</p>
      <div class="side-pills">${p.types.map(t => `<span>${t}</span>`).join('')}</div>
    </div>`).join('');
}

// ─── Navegación y scroll-spy ───────────────────────────────────────────────
function setupNav() {
  const ids = [...document.querySelectorAll('.nav-btn')].map(b => b.dataset.goto);
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-goto]');
    if (el) goto(el.dataset.goto);
  });

  const setActive = () => {
    let current = ids[0];
    for (const id of [...ids].reverse()) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 160) { current = id; break; }
    }
    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.goto === current));
  };
  window.addEventListener('scroll', setActive, { passive: true });
  setActive();
}

// ─── Campo de estrellas ────────────────────────────────────────────────────
function starField() {
  const cv = $('starfield');
  const ctx = cv.getContext('2d');
  const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);
  const stars = Array.from({ length: 350 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.4 + 0.2,
    o: Math.random() * 0.7 + 0.2,
    sp: Math.random() * 0.015 + 0.003,
    ph: Math.random() * Math.PI * 2,
  }));
  let t = 0;
  const draw = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const s of stars) {
      const o = s.o * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
      ctx.beginPath();
      ctx.arc(s.x * cv.width, s.y * cv.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${o})`;
      ctx.fill();
    }
    t++;
    requestAnimationFrame(draw);
  };
  draw();
}

// ─── Música ambiental (Web Audio) ──────────────────────────────────────────
function musicPlayer() {
  const btn = $('music-btn');
  const label = $('music-label');
  const audio = $('bg-music');
  audio.volume = 0.4;

  const ui = (on) => {
    btn.classList.toggle('on', on);
    label.textContent = on ? 'Música ON' : 'Música OFF';
  };

  const play = async () => {
    try {
      await audio.play();
      ui(true);
      return true;
    } catch {
      return false; // bloqueado por el navegador
    }
  };

  // Botón: alterna play/pausa
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // evita que dispare también el arranque automático
    if (audio.paused) play();
    else { audio.pause(); ui(false); }
  });

  // 1) Intentar autoplay al cargar
  play().then((ok) => {
    if (ok) return;

    // 2) Si falla, arrancar en la primera interacción
    const events = ['pointerdown', 'keydown', 'touchend'];
    const unlock = async () => {
      if (await play()) {
        events.forEach(ev => document.removeEventListener(ev, unlock));
      }
    };
    events.forEach(ev => document.addEventListener(ev, unlock));
  });
}

// ─── Inicio ────────────────────────────────────────────────────────────────
async function init() {
  starField();
  musicPlayer();
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    renderMiniList(data.trio);
    renderCards(data.trio);
    renderPokemonSections(data.trio);
    renderSideTypes(data.trio);
    setupNav();
  } catch (err) {
    $('pokemon-sections').innerHTML = '<p style="padding:3rem">No se pudo cargar data.json. Abre la página con un servidor local (por ejemplo: <code>python3 -m http.server</code>) en lugar de hacer doble clic en el archivo.</p>';
    console.error(err);
  }
}
init();
