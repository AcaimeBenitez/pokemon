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
function cosmicAudio() {
  const btn = $('music-btn');
  const label = $('music-label');
  let ctx = null, master = null, playing = false;

  const ui = () => {
    btn.classList.toggle('on', playing);
    label.textContent = playing ? 'Música ON' : 'Música OFF';
  };

  const build = () => {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const d1 = ctx.createDelay(3); d1.delayTime.value = 0.38;
    const d2 = ctx.createDelay(3); d2.delayTime.value = 0.82;
    const fb1 = ctx.createGain(); fb1.gain.value = 0.32;
    const fb2 = ctx.createGain(); fb2.gain.value = 0.26;
    const wet = ctx.createGain(); wet.gain.value = 0.38;
    const dry = ctx.createGain(); dry.gain.value = 0.52;
    d1.connect(fb1); fb1.connect(d2); d2.connect(fb2); fb2.connect(d1);
    d1.connect(wet); d2.connect(wet); wet.connect(master); dry.connect(master);

    const addOsc = (freq, type, gain, lfoRate = 0.07) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      osc.type = type; osc.frequency.value = freq;
      lp.type = 'lowpass'; lp.frequency.value = Math.min(freq * 6, 6000); lp.Q.value = 0.6;
      g.gain.value = gain;
      osc.connect(lp); lp.connect(g); g.connect(dry); g.connect(d1);
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = lfoRate + Math.random() * 0.03;
      lfoG.gain.value = freq * 0.004;
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      lfo.start(); osc.start();
    };

    const base = 55; // A1
    addOsc(base * 0.5, 'sine', 0.28, 0.04);
    addOsc(base,       'sine', 0.38);
    addOsc(base * 2,   'sine', 0.22);
    addOsc(base * 1.5, 'sine', 0.16, 0.09);
    addOsc(base * 3,   'triangle', 0.10);
    addOsc(base * 4,   'sine', 0.06);
    addOsc(base * 6,   'sine', 0.03, 0.05);
  };

  const start = () => {
    if (!ctx) build();
    ctx.resume();
    master.gain.setTargetAtTime(0.32, ctx.currentTime, 1.2);
    playing = true; ui();
  };
  const stop = () => {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.9);
    setTimeout(() => { if (!playing) ctx.suspend(); }, 1600);
    playing = false; ui();
  };

  btn.addEventListener('click', () => (playing ? stop() : start()));
}

// ─── Inicio ────────────────────────────────────────────────────────────────
async function init() {
  starField();
  cosmicAudio();
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
