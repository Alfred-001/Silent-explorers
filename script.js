/* =========================================================
   The Museum of Silent Explorers
   1. helpers          5. exhibit art (SVG)
   2. starfield        6. exhibit data
   3. nav & reveal     7. exhibit engine (mystery -> legacy)
   4. intro sequence   8. clocks, timeline, why, epilogue
   ========================================================= */
(() => {
  'use strict';

  /* ---------- 1. helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(res => setTimeout(res, reduceMotion ? Math.min(ms, 40) : ms));
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const rad = d => (d * Math.PI) / 180;
  const f1 = n => n.toFixed(1);

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } }
  };

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 4200);
  }

  /* ---------- 2. starfield ---------- */
  function initStarfield() {
    const canvas = $('#stars');
    const ctx = canvas.getContext('2d');
    const layers = [
      { n: 110, size: 0.7, alpha: 0.55, parallax: 0.03 },
      { n: 60, size: 1.1, alpha: 0.8, parallax: 0.07 },
      { n: 24, size: 1.7, alpha: 1, parallax: 0.14 }
    ];
    let w = 0, h = 0, dpr = 1, stars = [], shooters = [], nextShooter = 3000, last = 0;

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      stars = [];
      layers.forEach((l, li) => {
        for (let i = 0; i < l.n; i++) {
          stars.push({ x: Math.random(), y: Math.random(), li, phase: Math.random() * 6.28, speed: 0.6 + Math.random() * 1.6, warm: Math.random() < 0.18 });
        }
      });
      draw(performance.now());
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      const sy = window.scrollY * dpr;
      for (const s of stars) {
        const l = layers[s.li];
        const y = (((s.y * h - sy * l.parallax) % h) + h) % h;
        const tw = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(t / 1000 * s.speed + s.phase);
        ctx.globalAlpha = l.alpha * tw;
        ctx.fillStyle = s.warm ? '#ffe9b8' : '#dfe6ff';
        const r = l.size * dpr;
        ctx.fillRect(s.x * w, y, r, r);
      }
      ctx.globalAlpha = 1;
      for (const sh of shooters) {
        const g = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 14, sh.y - sh.vy * 14);
        g.addColorStop(0, `rgba(255,255,255,${sh.life})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6 * dpr;
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(sh.x - sh.vx * 14, sh.y - sh.vy * 14); ctx.stroke();
      }
    }

    function frame(t) {
      const dt = t - last; last = t;
      nextShooter -= dt;
      if (nextShooter <= 0) {
        shooters.push({ x: Math.random() * w * 0.8 + w * 0.2, y: Math.random() * h * 0.4, vx: -(7 + Math.random() * 5) * dpr, vy: (3 + Math.random() * 3) * dpr, life: 1 });
        nextShooter = 5000 + Math.random() * 7000;
      }
      shooters.forEach(s => { s.x += s.vx; s.y += s.vy; s.life -= 0.016; });
      shooters = shooters.filter(s => s.life > 0);
      draw(t);
      requestAnimationFrame(frame);
    }

    build();
    window.addEventListener('resize', build);
    if (reduceMotion) {
      window.addEventListener('scroll', () => draw(0), { passive: true });
    } else {
      requestAnimationFrame(frame);
    }
  }

  /* ---------- 3. nav & reveal ---------- */
  function initNav() {
    const nav = $('#nav');
    const links = $('#navLinks');
    const burger = $('#burger');
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('is-open', !open);
    });
    $$('a', links).forEach(a => a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      links.classList.remove('is-open');
    }));

    // field log popover
    const btn = $('#logBtn');
    const panel = $('#logPanel');
    const setLog = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', e => { e.stopPropagation(); setLog(panel.hidden); });
    document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target)) setLog(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setLog(false); });
    panel.addEventListener('click', e => { if (e.target.closest('a')) setLog(false); });

    // scroll spy
    const ids = ['moon', 'mars', 'deep', 'timeline', 'why', 'epilogue'];
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        $$('[data-spy]', links).forEach(a => a.classList.toggle('is-active', a.dataset.spy === en.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ids.forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  let revealObserver;
  function observeReveals(root = document) {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealObserver.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    $$('.reveal:not(.is-in)', root).forEach(el => revealObserver.observe(el));
  }

  /* ---------- 4. intro sequence ---------- */
  function initIntro() {
    const hero = $('.hero');
    const stages = $$('.stage', hero);
    const term = $('#termBody');
    const mapEl = $('#introMap');
    const nodes = $$('.map-node', hero);
    const count = $('#count');
    let token = 0;
    const alive = t => t === token;
    const show = name => stages.forEach(s => s.classList.toggle('is-active', s.dataset.stage === name));

    async function typeMessage(text, t, speed) {
      const p = document.createElement('p');
      p.className = 'msg';
      p.innerHTML = '<span class="msg__from">Unknown ›</span><span class="msg__text is-typing"></span>';
      term.appendChild(p);
      const span = $('.msg__text', p);
      if (reduceMotion) { span.textContent = text; span.classList.remove('is-typing'); return; }
      for (let i = 0; i < text.length; i++) {
        if (!alive(t)) return;
        span.textContent = text.slice(0, i + 1);
        await sleep(speed + (',.?'.includes(text[i]) ? 150 : 0));
      }
      span.classList.remove('is-typing');
    }

    function revealTitle() {
      hero.classList.remove('is-dark');
      show('title');
    }

    async function run() {
      const t = ++token;
      term.innerHTML = '';
      mapEl.classList.remove('is-on');
      nodes.forEach(n => n.classList.remove('is-on'));
      hero.classList.remove('is-dark');
      show('terminal');

      await sleep(1000); if (!alive(t)) return;
      await typeMessage('Before you explore the universe, discover what we left behind.', t, 34); if (!alive(t)) return;
      await sleep(1000); if (!alive(t)) return;

      mapEl.classList.add('is-on');
      for (const n of nodes) { n.classList.add('is-on'); await sleep(750); if (!alive(t)) return; }
      await sleep(600); if (!alive(t)) return;

      await typeMessage('You know about the astronauts who walked on the Moon. You know about the rovers exploring Mars. But do you know what happened to the machines after their missions ended?', t, 22);
      if (!alive(t)) return;
      await sleep(1800); if (!alive(t)) return;

      hero.classList.add('is-dark');   // the screen goes dark
      show('none');
      await sleep(1100); if (!alive(t)) return;

      show('countdown');
      for (const n of [3, 2, 1]) {
        if (!alive(t)) return;
        count.textContent = n;
        count.classList.remove('is-tick'); void count.offsetWidth; count.classList.add('is-tick');
        await sleep(1000);
      }
      if (!alive(t)) return;
      revealTitle();
    }

    $('#openMessage').addEventListener('click', run);
    $$('[data-skip]', hero).forEach(b => b.addEventListener('click', () => { token++; revealTitle(); }));
    $('#replay').addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      token++;
      setTimeout(() => { hero.classList.remove('is-dark'); show('invite'); }, reduceMotion ? 0 : 500);
    });
  }

  /* ---------- 5. exhibit art (original SVG drawings) ---------- */
  const wheelArt = (cx, cy, r, o = 1) => {
    const spokes = [0, 45, 90, 135].map(a => {
      const dx = (r - 8) * Math.cos(rad(a)), dy = (r - 8) * Math.sin(rad(a));
      return `<line x1="${f1(cx - dx)}" y1="${f1(cy - dy)}" x2="${f1(cx + dx)}" y2="${f1(cy + dy)}"/>`;
    }).join('');
    return `<g class="wheel" style="transform-origin:${cx}px ${cy}px" opacity="${o}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#171a26" stroke="#b7c0d4" stroke-width="5"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 3.5}" fill="none" stroke="#e8edf8" stroke-width="3" stroke-dasharray="5 4"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 12}" fill="none" stroke="#5c667d" stroke-width="1.5"/>
      <g stroke="#7f8aa3" stroke-width="1.5">${spokes}</g>
      <circle cx="${cx}" cy="${cy}" r="7" fill="#d8dfee"/><circle cx="${cx}" cy="${cy}" r="3" fill="#586079"/>
    </g>`;
  };

  function artLRV() {
    const lattice = Array.from({ length: 8 }, (_, i) => { const x = 118 + i * 26; return `M${x} 172L${x + 12} 194M${x + 12} 172L${x} 194`; }).join('');
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lunar Roving Vehicle">
      <defs>
        <linearGradient id="lrvM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f4fb"/><stop offset="1" stop-color="#8590a8"/></linearGradient>
        <linearGradient id="lrvD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fafbfe"/><stop offset="1" stop-color="#a5aec3"/></linearGradient>
      </defs>
      <ellipse cx="200" cy="268" rx="172" ry="9" fill="#000" opacity=".4"/>
      <g stroke="#9aa4bb" stroke-width="1.5" stroke-dasharray="3 6" opacity=".4"><path d="M6 262H64"/><path d="M6 270H54"/></g>
      ${wheelArt(152, 230, 30, 0.5)}${wheelArt(316, 230, 30, 0.5)}
      <rect x="300" y="146" width="34" height="28" rx="3" fill="#6d778f" stroke="#2b3347" stroke-width="2"/>
      <path d="M308 146v-10h18v10" fill="none" stroke="#9aa5bd" stroke-width="3"/>
      <path d="M84 198L104 170H318L336 198Z" fill="url(#lrvM)" stroke="#3a445c" stroke-width="2"/>
      <path d="${lattice}" stroke="#5b657e" stroke-width="1.6" fill="none"/>
      <path d="M128 236V198M292 236V198" stroke="#59627a" stroke-width="5"/>
      ${wheelArt(128, 236, 32)}${wheelArt(292, 236, 32)}
      <g fill="none" stroke="#dfe5f1" stroke-width="5" stroke-linecap="round"><path d="M94 226Q128 190 162 226"/><path d="M258 226Q292 190 326 226"/></g>
      <g fill="#8792ab" stroke="#2b3347" stroke-width="2">
        <rect x="170" y="158" width="46" height="9" rx="3"/><rect x="170" y="124" width="8" height="36" rx="3"/>
        <rect x="230" y="158" width="46" height="9" rx="3"/><rect x="230" y="124" width="8" height="36" rx="3"/>
      </g>
      <path d="M142 170V128" stroke="#cfd6e6" stroke-width="5" stroke-linecap="round"/>
      <rect x="126" y="122" width="32" height="8" rx="4" fill="#cfd6e6" stroke="#2b3347" stroke-width="1.5"/>
      <rect x="130" y="148" width="22" height="16" rx="3" fill="#4a5470" stroke="#2b3347" stroke-width="1.5"/>
      <rect x="80" y="152" width="20" height="14" rx="3" fill="#d6dcea" stroke="#2b3347" stroke-width="1.5"/><circle cx="80" cy="159" r="4" fill="#161a28" stroke="#9aa5bd"/>
      <path d="M104 172L106 112" stroke="#cfd6e6" stroke-width="4" stroke-linecap="round"/>
      <path d="M64 98Q106 150 148 98Z" fill="url(#lrvD)" stroke="#59627a" stroke-width="2"/>
      <ellipse cx="106" cy="98" rx="42" ry="9" fill="#eef1f8" stroke="#59627a" stroke-width="2"/>
      <path d="M106 98V70" stroke="#cfd6e6" stroke-width="3"/><circle cx="106" cy="68" r="4" fill="#cfd6e6"/>
      <path d="M318 146L334 100" stroke="#cfd6e6" stroke-width="2.5"/><circle cx="334" cy="98" r="4" fill="#cfd6e6"/>
    </svg>`;
  }

  function artReflector() {
    const cols = 8, rows = 5, x0 = 102, y0 = 82, dx = 28, dy = 28;
    let cubes = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * dx, y = y0 + r * dy;
        cubes += `<circle cx="${x}" cy="${y}" r="11" fill="url(#rrG)" stroke="#232a41" stroke-width="2"/>
          <path d="M${x} ${y - 11}V${y}M${x} ${y}L${f1(x - 9.5)} ${f1(y + 5.5)}M${x} ${y}L${f1(x + 9.5)} ${f1(y + 5.5)}" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>`;
      }
    }
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Laser retroreflector array">
      <defs>
        <linearGradient id="rrM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e7ebf5"/><stop offset="1" stop-color="#7d88a2"/></linearGradient>
        <radialGradient id="rrG" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#e9f6ff"/><stop offset=".55" stop-color="#6e8fc4"/><stop offset="1" stop-color="#1c2a52"/></radialGradient>
      </defs>
      <ellipse cx="200" cy="270" rx="165" ry="8" fill="#000" opacity=".4"/>
      <path d="M118 212L92 266M282 212L308 266M200 212V264" stroke="#7a859e" stroke-width="5" stroke-linecap="round"/>
      <rect x="84" y="62" width="232" height="152" rx="8" fill="url(#rrM)" stroke="#3a445c" stroke-width="3"/>
      ${cubes}
      <line class="beam" x1="8" y1="34" x2="188" y2="134" stroke="#7dffa0" stroke-width="3" stroke-linecap="round"/>
      <line class="beam beam--back" x1="200" y1="128" x2="22" y2="26" stroke="#c9ffd8" stroke-width="2" stroke-linecap="round"/>
      <circle cx="194" cy="131" r="9" fill="#7dffa0" opacity=".35"/>
    </svg>`;
  }

  const roverWheel = (cx, cy, r, o = 1) => {
    const ticks = Array.from({ length: 14 }, (_, i) => {
      const a = rad(i * 360 / 14);
      return `<line x1="${f1(cx + (r - 2) * Math.cos(a))}" y1="${f1(cy + (r - 2) * Math.sin(a))}" x2="${f1(cx + (r + 4) * Math.cos(a))}" y2="${f1(cy + (r + 4) * Math.sin(a))}"/>`;
    }).join('');
    return `<g class="wheel" style="transform-origin:${cx}px ${cy}px" opacity="${o}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#262b3a" stroke="#a3acc0" stroke-width="4"/>
      <g stroke="#c4cbdb" stroke-width="2.4" stroke-linecap="round">${ticks}</g>
      <circle cx="${cx}" cy="${cy}" r="${r - 9}" fill="none" stroke="#5d6780" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="#d9deea"/>
    </g>`;
  };

  function artRover(kind) {
    const p = kind;
    const solarCols = Array.from({ length: 9 }, (_, i) => {
      const k = i * (174 / 8);
      return `M${f1(148 + k)} 92L${f1(120 + k)} 120`;
    }).join('');
    const dust = Array.from({ length: 16 }, (_, i) => {
      const cx = 30 + ((i * 53) % 380), cy = 50 + ((i * 37) % 200), r = 1.4 + (i % 3) * 0.8;
      return `<circle class="dust" cx="${cx}" cy="${cy}" r="${r}" fill="#d98a5a" style="animation-delay:-${(i * 0.7).toFixed(1)}s"/>`;
    }).join('');
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mars rover">
      <defs>
        <linearGradient id="${p}Gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1d27c"/><stop offset="1" stop-color="#b78a2d"/></linearGradient>
        <linearGradient id="${p}Solar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d3f93"/><stop offset="1" stop-color="#0f1844"/></linearGradient>
      </defs>
      <ellipse cx="205" cy="268" rx="175" ry="8" fill="#000" opacity=".4"/>
      ${roverWheel(122, 228, 24, 0.5)}${roverWheel(214, 228, 24, 0.5)}${roverWheel(318, 228, 24, 0.5)}
      <g fill="none" stroke="#98a2b8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M104 238L150 206L196 238"/><path d="M150 206L196 176"/><path d="M300 238L252 196L214 176"/>
      </g>
      <rect x="132" y="120" width="150" height="56" rx="8" fill="url(#${p}Gold)" stroke="#6b4c14" stroke-width="2.5"/>
      <path d="M144 134h126M144 148h126M144 162h126" stroke="#8a6620" stroke-opacity=".35" stroke-width="1"/>
      <polygon points="120,120 294,120 322,92 148,92" fill="url(#${p}Solar)" stroke="#0b1230" stroke-width="2"/>
      <path d="${solarCols}M134 106H308" stroke="#7d92ff" stroke-opacity=".4" stroke-width="1" fill="none"/>
      ${kind === 'oppy' ? '<polygon points="120,120 294,120 322,92 148,92" fill="#c9683a" opacity=".5"/>' : ''}
      <path d="M268 94V46" stroke="#d0d6e4" stroke-width="5" stroke-linecap="round"/>
      <rect x="250" y="30" width="36" height="18" rx="4" fill="#dde2ee" stroke="#59627a" stroke-width="2"/>
      <circle cx="260" cy="40" r="4.5" fill="#141829" stroke="#9aa3b8"/><circle cx="276" cy="40" r="4.5" fill="#141829" stroke="#9aa3b8"/>
      <ellipse cx="196" cy="104" rx="24" ry="8" fill="#eef1f8" stroke="#59627a" stroke-width="2"/>
      <path d="M156 98L152 68" stroke="#cfd6e6" stroke-width="3"/><circle cx="152" cy="66" r="4" fill="#cfd6e6"/>
      ${roverWheel(104, 238, 26)}${roverWheel(196, 238, 26)}${roverWheel(300, 238, 26)}
      <path d="M132 150L96 162L74 184" fill="none" stroke="#b9c1d4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="74" cy="186" r="9" fill="#596382" stroke="#2b3347" stroke-width="2"/>
      ${kind === 'spirit' ? '<path d="M176 270Q226 230 300 238Q342 242 376 264L376 276L176 276Z" fill="#a24e2c"/><path d="M200 262Q250 240 310 248" stroke="#c97a4a" stroke-width="2" fill="none" opacity=".6"/>' : dust}
    </svg>`;
  }

  function artVoyager() {
    const cx = 175, cy = 132;
    const arcs = [92, 114, 136].map((r, i) => {
      const a1 = rad(196), a2 = rad(250);
      return `<path class="sig" style="--i:${i}" d="M${f1(cx + r * Math.cos(a1))} ${f1(cy + r * Math.sin(a1))}A${r} ${r} 0 0 1 ${f1(cx + r * Math.cos(a2))} ${f1(cy + r * Math.sin(a2))}" fill="none" stroke="#9fb0ff" stroke-width="3" stroke-linecap="round"/>`;
    }).join('');
    const rtgs = [[122, 227], [95, 236], [68, 245]].map(([x, y]) =>
      `<g transform="rotate(18 ${x} ${y})"><rect x="${x - 12}" y="${y - 5}" width="24" height="10" rx="3" fill="#5b6477" stroke="#2b3347" stroke-width="1.5"/><path d="M${x - 8} ${y - 5}v10M${x - 3} ${y - 5}v10M${x + 2} ${y - 5}v10M${x + 7} ${y - 5}v10" stroke="#9aa5bd" stroke-width="1"/></g>`).join('');
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Voyager spacecraft">
      <defs>
        <radialGradient id="vgDish" cx=".4" cy=".35" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#a3adc4"/></radialGradient>
        <radialGradient id="vgInner" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#7d87a0"/><stop offset="1" stop-color="#d9deea"/></radialGradient>
        <radialGradient id="vgGold" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff0b8"/><stop offset="1" stop-color="#b8861f"/></radialGradient>
      </defs>
      ${arcs}
      <path d="M160 214L52 250" stroke="#8b93a8" stroke-width="4" stroke-linecap="round"/>${rtgs}
      <path d="M226 208L352 248" stroke="#8b93a8" stroke-width="4" stroke-linecap="round"/>
      <rect x="338" y="238" width="30" height="20" rx="3" fill="#caa24a" stroke="#4a3a12" stroke-width="2"/><circle cx="353" cy="248" r="5" fill="#151a29" stroke="#f0dca0"/>
      <path d="M214 176L388 120" stroke="#a9b2c6" stroke-width="2"/><path d="M214 176L388 120" stroke="#5b657e" stroke-width="1" stroke-dasharray="2 4"/>
      <rect x="296" y="142" width="14" height="10" rx="2" fill="#8b93a8" transform="rotate(-18 303 147)"/><rect x="380" y="114" width="12" height="9" rx="2" fill="#cfd6e6" transform="rotate(-18 386 118)"/>
      <polygon points="226,196 208,227 172,227 154,196 172,165 208,165" fill="#9ea5b6" stroke="#4a5368" stroke-width="2.5"/>
      <path d="M172 165L208 227M208 165L172 227" stroke="#4a5368" stroke-opacity=".35"/>
      <circle cx="190" cy="204" r="11" fill="url(#vgGold)" stroke="#6b4c14" stroke-width="1.5"/><circle cx="190" cy="204" r="3" fill="#2a1d05"/>
      <g transform="rotate(-18 ${cx} ${cy})">
        <ellipse cx="${cx}" cy="${cy}" rx="82" ry="56" fill="url(#vgDish)" stroke="#8e98ad" stroke-width="3"/>
        <ellipse cx="${cx}" cy="${cy}" rx="62" ry="41" fill="url(#vgInner)"/>
        <path d="M${cx} 188L${cx} ${cy - 6}M104 104L${cx} ${cy - 6}M246 104L${cx} ${cy - 6}" stroke="#4a5368" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cy - 6}" r="6" fill="#d9deea" stroke="#4a5368" stroke-width="2"/>
      </g>
    </svg>`;
  }

  function artRecord() {
    const cx = 160, cy = 150, R = 116;
    let grooves = '';
    for (let r = 42; r <= 110; r += 3.5) grooves += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${Math.round(r / 3.5) % 2 ? 'rgba(80,48,4,.38)' : 'rgba(255,238,170,.28)'}" stroke-width=".7"/>`;
    const angles = [0, 25, 47, 70, 95, 118, 140, 160, 185, 205, 230, 255, 285, 320];
    const lens = [30, 24, 36, 20, 34, 28, 38, 22, 32, 26, 36, 30, 24, 34];
    const px = 339, py = 224;
    const pulsars = angles.map((a, i) => {
      const x = px + lens[i] * Math.cos(rad(a)), y = py + lens[i] * Math.sin(rad(a));
      return `<line x1="${px}" y1="${py}" x2="${f1(x)}" y2="${f1(y)}"/><circle cx="${f1(x)}" cy="${f1(y)}" r="1.9" fill="#1f2638" stroke="none"/>`;
    }).join('');
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Golden Record">
      <defs>
        <radialGradient id="grG" cx=".35" cy=".3" r=".95"><stop offset="0" stop-color="#fbeaa6"/><stop offset=".55" stop-color="#d1a03a"/><stop offset="1" stop-color="#7d5410"/></radialGradient>
        <clipPath id="grClip"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
      </defs>
      <ellipse cx="${cx}" cy="272" rx="110" ry="7" fill="#000" opacity=".4"/>
      <g class="disc" style="transform-origin:${cx}px ${cy}px">
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#grG)" stroke="#6b4a0c" stroke-width="3"/>
        ${grooves}
        <circle cx="${cx}" cy="${cy}" r="37" fill="#b98421" stroke="#6b4a0c" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="25" fill="none" stroke="#6b4a0c" stroke-width="1.4" stroke-dasharray="3 4"/>
        <circle cx="${cx}" cy="${cy}" r="5" fill="#05060d"/>
      </g>
      <g clip-path="url(#grClip)"><path d="M${cx} ${cy}L${cx + 60} ${cy - 130}L${cx + 140} ${cy - 90}Z" fill="#fff" opacity=".16"/><path d="M${cx} ${cy}L${cx - 120} ${cy + 80}L${cx - 70} ${cy + 140}Z" fill="#fff" opacity=".1"/></g>
      <rect x="290" y="178" width="98" height="92" rx="8" fill="#a9b1c4" stroke="#4c566e" stroke-width="2"/>
      <g stroke="#1f2638" stroke-width="1.6" stroke-linecap="round">${pulsars}</g>
      <circle cx="${px}" cy="${py}" r="3.2" fill="#1f2638"/>
    </svg>`;
  }

  /* ---------- 6. exhibit data ---------- */
  const STAGES = ['Mystery', 'Discovery', 'Story', 'Science', 'Legacy'];

  const GALLERIES = {
    moon: { accent: 'var(--moon)', short: 'The Moon' },
    mars: { accent: 'var(--mars)', short: 'Mars' },
    deep: { accent: 'var(--deep)', short: 'Deep space' }
  };

  const EXHIBITS = [
    {
      id: 'lrv', gallery: 'moon', no: '001', art: artLRV,
      name: 'Lunar Roving Vehicle', alias: 'The Moon buggy. Flown on Apollo 15, 16 and 17.',
      mystery: {
        title: 'Object detected on the lunar surface',
        clues: [
          'No signal. No power. Its last driver left in 1972.',
          'Four wheels with no air in them, parked where there has never been a road.',
          'Three identical machines sit on the Moon today, at three different landing sites.'
        ],
        options: ['Lunar Roving Vehicle', 'Lunokhod 1', 'Surveyor 3'], answer: 0,
        nudge: 'It carried two people, and it was folded up to fit inside a lander.'
      },
      facts: [['3', 'flown: Apollo 15, 16 and 17'], ['About 13 km/h', 'design top speed'], ['About 36 km', 'driven on Apollo 17 alone'], ['210 kg', 'mass on Earth']],
      discovery: `<h4>What is it?</h4>
        <p>A battery-powered, two-seat electric vehicle, light enough to be folded flat and stowed in the side of the lunar lander. On the surface it opened out into a little open-frame car with wire-mesh wheels.</p>
        <h4>Why did NASA send it?</h4>
        <p>On foot, an astronaut in a pressurised suit can only roam so far from the lander. The rover stretched that range to kilometres, so crews could reach different kinds of terrain, collect more varied samples and still get back safely.</p>`,
      storyTitle: 'Parked, not abandoned',
      story: `<p>Apollo 15 drove the first one in July 1971. Apollo 16 and Apollo 17 followed. Each crew had to unfold it, drive it over rough, dusty ground and trust it to get them home.</p>
        <p>It didn't always go smoothly. On Apollo 17 a fender broke off and sprayed dust everywhere, so the astronauts built a replacement from laminated maps and duct tape, clamped in place. It worked.</p>
        <p>Then the missions ended and the crews flew home. The rovers stayed where they were parked, because bringing them back meant carrying more weight, and weight was reserved for what mattered most: the rocks. The six Apollo landings returned more than 380 kg of lunar samples.</p>`,
      voice: 'I was folded into a box, unfolded once, and then I carried two explorers farther than their own legs ever could.',
      scienceTitle: 'How it worked, and what it made possible',
      science: `<p><strong>How it worked.</strong> Each wheel had its own electric motor, powered by non-rechargeable silver-zinc batteries. The wheels were woven from zinc-coated piano wire with titanium treads: nothing to puncture, nothing to inflate. A gyroscope-based navigation system always knew the way back to the lander.</p>
        <p><strong>What it made possible.</strong> The rover carried people, and people found things: the "Genesis Rock", a piece of ancient lunar crust, on Apollo 15, and orange volcanic glass in the soil on Apollo 17. A remote-controlled TV camera also let Mission Control watch the crews work.</p>`,
      legacyTitle: 'Tracks that nothing erases',
      legacy: `<p>With no wind or rain on the Moon, wheel tracks can last a very long time. The rovers are silent museum pieces, and a lesson in building something rugged enough to work with no repair shop in sight.</p>`,
      learn: [
        'Lunar dust gets into everything. Plan for it from day one.',
        'Airless wheels, made of mesh and treads, can work where tyres cannot.',
        'A vehicle should be repairable with simple tools, even duct tape.',
        "NASA's Artemis programme is planning new vehicles for astronauts to drive across the Moon."
      ]
    },
    {
      id: 'llr', gallery: 'moon', no: '002', art: artReflector,
      name: 'Laser Retroreflector Array', alias: 'Placed by Apollo 11, 14 and 15.',
      mystery: {
        title: 'Object detected near a landing site',
        clues: [
          'No wires. No batteries. No electronics.',
          'Aim a laser at it from Earth and it fires the light straight back at you.',
          'Still answering, more than fifty years later.'
        ],
        options: ['Laser Retroreflector Array', 'Passive Seismometer', 'Solar Wind Collector'], answer: 0,
        nudge: 'It works like the reflector on a bicycle, but it is 384,400 km away.'
      },
      facts: [['3', 'Apollo arrays: 11, 14 and 15'], ['0 watts', 'power needed'], ['About 2.5 s', 'round trip of a laser pulse'], ['3.8 cm a year', 'how fast the Moon drifts away']],
      discovery: `<h4>What is it?</h4>
        <p>A panel of "corner-cube" glass prisms in a metal frame. Apollo 11 and Apollo 14 each left an array of 100; Apollo 15 left 300. A corner cube sends light straight back the way it came, whatever the angle.</p>
        <h4>Why did NASA send it?</h4>
        <p>To give scientists a permanent target. Fire a laser pulse from Earth, time how long it takes to return, and you can measure the distance to the Moon with extraordinary precision.</p>`,
      storyTitle: 'The experiment that never needed to come home',
      story: `<p>In July 1969, the Apollo 11 astronauts set the first array in the dust near their landing site. Within weeks, observatories on Earth had caught laser flashes bouncing back from the Moon.</p>
        <p>It isn't easy: only a tiny handful of photons come back from each pulse. But the array needs no power, has no moving parts, and nothing in it can wear out.</p>
        <p>Why leave it behind? Because it was never meant to leave. A reflector is only useful if it stays exactly where it is.</p>`,
      voice: "I don't transmit. I don't compute. I just give your light back, and that's enough.",
      scienceTitle: 'Timing the light',
      science: `<p><strong>How it works.</strong> Three mirrors meeting at right angles reflect light back parallel to where it came from. A pulse takes about 2.5 seconds for the round trip. Multiply the time by the speed of light, halve it, and you have the distance.</p>
        <p><strong>What it discovered.</strong> The Moon is drifting away from Earth by about 3.8 centimetres a year. The same measurements have been used to test Einstein's general relativity and to learn about the Moon's interior.</p>`,
      legacyTitle: 'Science that outlived the astronauts',
      legacy: `<p>Observatories around the world still fire lasers at these reflectors. A piece of equipment placed by astronauts decades ago is still helping scientists do research today.</p>`,
      learn: [
        'Simple, passive hardware can outlast complex machines by decades.',
        'A long record turns tiny effects into measurable science.',
        'A permanent reference point lets future scientists ask new questions.',
        'Future lunar landers can extend the network with new reflectors.'
      ]
    },
    {
      id: 'spirit', gallery: 'mars', no: '003', art: () => artRover('spirit'),
      name: 'Spirit', alias: 'Mars Exploration Rover A. Gusev Crater.',
      mystery: {
        title: 'Object detected in a Martian crater',
        clues: [
          'Landed in January 2004. Designed to work for 90 Martian days.',
          'It kept working for more than six years.',
          'It dragged one dead wheel for years, and found treasure.'
        ],
        options: ['Spirit', 'Sojourner', 'Viking 1'], answer: 0,
        nudge: 'It has a twin that landed three weeks later on the other side of the planet.'
      },
      facts: [['90 sols', 'planned mission'], ['More than 6 years', 'actual mission'], ['About 7.7 km', 'driven'], ['185 kg', 'mass']],
      discovery: `<h4>What is it?</h4>
        <p>A solar-powered, six-wheeled robot geologist about the size of a golf cart, with cameras for eyes, a robotic arm and a tool for grinding into rock.</p>
        <h4>Why did NASA send it?</h4>
        <p>To "follow the water". Gusev Crater looked like an ancient lake bed, and Spirit's job was to read its rocks and find out whether Mars once had conditions that could support life.</p>`,
      storyTitle: 'The rover that drove backwards',
      story: `<p>Spirit landed in January 2004, cushioned by airbags. In 2006 one of its wheels stopped turning. Engineers on Earth didn't give up: they had Spirit drive backwards, dragging the dead wheel behind it like a plough.</p>
        <p>That plough turned up bright soil rich in silica, a clue to ancient hot water.</p>
        <p>In 2009 Spirit broke through a crust and sank into soft sand. Months of work on Earth, rehearsed with a replica rover in sand, couldn't free it. When Martian winter came it couldn't angle itself toward the Sun, and its last message arrived in March 2010. It could not come home, so it stays: first a stationary science station, then a silent one.</p>`,
      voice: 'They asked me to work for three months. I gave them six years and one dragging wheel.',
      scienceTitle: 'A geologist on six wheels',
      science: `<p><strong>How it worked.</strong> Solar panels charged batteries so it could work by day and sleep at night. Panoramic cameras scouted targets, and an arm pressed a microscope and spectrometers against rock. A Rock Abrasion Tool ground away dusty surfaces to expose fresh rock inside.</p>
        <p><strong>What it discovered.</strong> Around a feature called Home Plate it found silica-rich deposits, most likely formed by hot springs or steam vents. On Earth, places like that can host microbial life. Many of the rocks it studied had been altered by water.</p>`,
      legacyTitle: 'Lessons written in sand',
      legacy: `<p>Spirit proved that a team on Earth can keep a damaged robot useful for years with clever driving. Its sand trap also changed how later rovers are tested: engineers now practise with replicas in loose sand before driving on Mars.</p>`,
      learn: [
        'Plan for failure: a rover with a broken wheel can still be a great geologist.',
        'Test wheels in loose sand and soft ground before landing.',
        'Hot-spring deposits are promising places to look for traces of past life.',
        'Surviving winter takes power, warmth and a good place to park.'
      ]
    },
    {
      id: 'oppy', gallery: 'mars', no: '004', art: () => artRover('oppy'),
      name: 'Opportunity', alias: 'Mars Exploration Rover B. Meridiani Planum.',
      mystery: {
        title: 'Object detected on a Martian plain',
        clues: [
          'Landed in January 2004, on the opposite side of Mars from its twin.',
          'Warranty: 90 sols. It worked for 5,111.',
          'Silenced in 2018 by a planet-wide dust storm.'
        ],
        options: ['Opportunity', 'Curiosity', 'Mars Pathfinder'], answer: 0,
        nudge: 'It drove farther than a marathon.'
      },
      facts: [['5,111', 'sols worked (90 planned)'], ['About 14 years', 'on Mars'], ['45 km', 'driven, more than a marathon'], ['2019', 'mission declared complete']],
      discovery: `<h4>What is it?</h4>
        <p>Spirit's twin: the same six wheels, the same solar panels, the same toolkit. Only the landing site was different: Meridiani Planum, a flat plain where orbiters had detected hematite, an iron mineral that often forms in water.</p>
        <h4>Why did NASA send it?</h4>
        <p>Same question as its twin: was Mars once wet, and for how long? Opportunity went to read the answer in the rocks.</p>`,
      storyTitle: 'The little machine that refused to give up',
      story: `<p>Opportunity bounced into a small crater in January 2004 and landed beside layered rock, a perfect start. Over more than 14 years it travelled from crater to crater. Wind gusts sometimes swept dust off its panels, handing it extra life. In 2015 its total distance passed that of a marathon.</p>
        <p>In June 2018 a dust storm grew until it blanketed the planet. The sky darkened and sunlight could no longer reach Opportunity's solar panels. Its last signal arrived on 10 June. NASA sent over a thousand commands, hoping the wind would clean its panels. No reply came. In February 2019, NASA declared the mission over.</p>
        <p>It never came home. It never received a medal. But it changed what we know about Mars.</p>`,
      voice: 'My mission was 90 days long. I kept going until the sky went dark.',
      scienceTitle: 'Reading water in the rocks',
      science: `<p><strong>How it worked.</strong> The same kit as Spirit: panoramic cameras, a microscope, spectrometers and a grinding tool, all carried on a solar-powered body that napped through each Martian night.</p>
        <p><strong>What it discovered.</strong> Tiny round pebbles of hematite, nicknamed "blueberries", that formed in water-soaked rock. Layered rocks rippled like a stream bed. Minerals such as jarosite, which forms in acidic water. Together they showed that liquid water once soaked this part of Mars, though it was salty and acidic rather than a friendly lake.</p>`,
      legacyTitle: 'The lights that went out',
      legacy: `<p>Opportunity's end taught engineers a hard lesson: solar power can be a weakness on a planet with global dust storms. Curiosity and Perseverance carry their own nuclear power source instead. And its longest-lasting legacy is the science: 14 years of data that researchers are still mining.</p>`,
      learn: [
        'Design for dust, cold and long life, and expect the unexpected.',
        'Solar power is great until the sky goes dark. A nuclear power source solves that.',
        'Wind can be an ally: it cleaned the panels for years.',
        'Hematite, layers and ripples are signposts for past water.'
      ]
    },
    {
      id: 'voyager', gallery: 'deep', no: '005', art: artVoyager,
      name: 'Voyager 1 and 2', alias: 'Twin spacecraft, launched in 1977.',
      mystery: {
        title: 'Object detected beyond the planets',
        clues: [
          'Launched in 1977, and still talking to us.',
          'No fuel to turn around, and no reason to: it is leaving the Solar System.',
          'Nothing else built by humans is farther from Earth.'
        ],
        options: ['The Voyager twins', 'Pioneer 10', 'New Horizons'], answer: 0,
        nudge: 'There are two of them, and each carries a message.'
      },
      facts: [['1977', 'launched'], ['More than 24 billion km', 'Voyager 1 from Earth'], ['Almost a day', 'one-way signal time'], ['2', 'in interstellar space']],
      discovery: `<h4>What is it?</h4>
        <p>Two robotic probes, each weighing roughly 720 kg, powered by plutonium, carrying cameras, instruments and a 3.7-metre dish antenna to call home.</p>
        <h4>Why did NASA send it?</h4>
        <p>To explore the outer planets: Jupiter and Saturn for both, then Uranus and Neptune for Voyager 2. The mission used a rare alignment of the planets that comes around only about once every 175 years.</p>`,
      storyTitle: 'The grand tour that never ended',
      story: `<p>The Voyagers flew past Jupiter and Saturn and sent back pictures that rewrote the textbooks, including the first active volcanoes seen beyond Earth, on Jupiter's moon Io. Voyager 2 went on to Uranus and Neptune; no other spacecraft has visited them.</p>
        <p>In 1990, Voyager 1 turned its camera around for one last look back and photographed Earth as a tiny speck from billions of kilometres away: the "Pale Blue Dot".</p>
        <p>Then they kept going. Voyager 1 entered interstellar space in 2012 and Voyager 2 in 2018. Unlike the rovers on the Moon and Mars, they are not abandoned equipment: they are still travelling and still sending data, while engineers switch off instruments one by one to stretch the power.</p>`,
      voice: "Every day I'm farther from home than anything you've ever made. Every day I still call.",
      scienceTitle: 'Engineering for the long haul',
      science: `<p><strong>How it works.</strong> Radioisotope generators turn the heat of decaying plutonium into electricity, which fades a little each year. Computers with memory measured in kilobytes, a tape recorder and a big dish pointed at Earth do the rest. NASA's Deep Space Network picks up the whisper-weak signal.</p>
        <p><strong>What it discovered.</strong> Active volcanoes on Io, faint rings around Jupiter, fine structure in Saturn's rings, ten new moons at Uranus, geysers on Neptune's moon Triton. And since crossing the edge of the Sun's influence, the first direct measurements of interstellar space.</p>`,
      legacyTitle: 'Built for a few years, still going after decades',
      legacy: `<p>The Voyagers were designed for a mission of a few years. Nearly half a century later they are the only spacecraft to have sampled interstellar space directly. Every mission that follows is built on what they proved: machines can be made to last.</p>`,
      learn: [
        'Redundancy and simplicity let the Voyagers outlive every plan.',
        'Power decides when a mission ends, so instruments are switched off one by one.',
        "The edge of the Sun's influence can be measured directly, not just modelled.",
        'Keep the listening network alive: faint signals need big antennas on Earth.'
      ]
    },
    {
      id: 'record', gallery: 'deep', accent: 'var(--gold)', no: '006', art: artRecord,
      name: 'The Golden Record', alias: 'A message from Earth, aboard both Voyagers.',
      mystery: {
        title: 'Object attached to a spacecraft',
        clues: [
          'A copper disc plated in gold. One on each Voyager.',
          'It holds sounds and pictures, not data about the machine.',
          'Its intended audience is unknown. Perhaps nobody.'
        ],
        options: ['The Golden Record', 'The Arecibo Message', 'The Pioneer Plaque'], answer: 0,
        nudge: 'It is a record in the old sense: you play it with a needle.'
      },
      facts: [['55', 'languages greeted'], ['115', 'images encoded'], ['About 90 min', 'of music from many cultures'], ['About a billion years', 'designed lifetime']],
      discovery: `<h4>What is it?</h4>
        <p>A 12-inch gold-plated copper phonograph record, packed with a cartridge, a needle and playing instructions engraved on its cover. It carries greetings in 55 languages, 115 images, the sounds of Earth (wind, thunder, birdsong, whales, laughter), about 90 minutes of music and messages from world leaders.</p>
        <h4>Why was it sent?</h4>
        <p>As a message in a bottle: a time capsule of what Earth was like, in case anyone, someday, finds it.</p>`,
      storyTitle: 'A message to whoever finds us',
      story: `<p>A small team led by astronomer Carl Sagan chose its contents in a matter of months. The music runs from Bach and Beethoven to Chuck Berry and Peruvian panpipes, and includes an Indian raga, "Jaat Kahan Ho", sung by Kesarbai Kerkar.</p>
        <p>It isn't built for an audience. It is a gift, and a statement: we were curious about the universe around us, and we hoped for company.</p>
        <p>It cannot be retrieved. Voyager 1 will pass within about 1.6 light-years of the star Gliese 445 in roughly 40,000 years. The record will still be there, waiting.</p>`,
      voice: "I don't know who will play me. I was made to be played anyway.",
      scienceTitle: 'Instructions for a stranger',
      science: `<p><strong>How to play it.</strong> The cover shows the way: where to set the needle, how fast to spin the disc. The diagrams use physics as a common language, with the hydrogen atom as a unit of time and a map of 14 pulsars to locate the Sun. The images are stored as sound, and played back they turn into pictures line by line.</p>
        <p><strong>What it teaches.</strong> How do you talk to a mind that shares nothing with you except physics? The record's design is a puzzle in communication, set decades before anyone knew whether another civilisation exists.</p>`,
      legacyTitle: 'The ghost of a hello',
      legacy: `<p>Even if no one ever finds it, the Golden Record has already done its job on Earth: it made people ask what they would say. It reminds us that the Voyagers are more than machines. They are a message from our planet into the vastness of space.</p>`,
      learn: [
        'Choose what to preserve, and what you want to be remembered by.',
        'Use universal ideas, like maths and physics, when you cannot share a language.',
        'Build to last: gold plating and a protective cover for a billion years.',
        'Ask the question yourself: what would you put on it?'
      ]
    }
  ];

  /* ---------- 7. exhibit engine ---------- */
  const doneSet = new Set(store.get('mse-done', []));
  const exhibitRoots = [];

  function updateLog(announce) {
    const total = EXHIBITS.length;
    $('#logCount').textContent = `${doneSet.size}/${total}`;
    $('#logList').innerHTML = EXHIBITS.map(ex =>
      `<li><a href="#exhibit-${ex.id}"><span class="tick ${doneSet.has(ex.id) ? 'is-done' : ''}"></span>${ex.name}</a></li>`).join('');

    const badge = $('#badge');
    const complete = doneSet.size === total;
    badge.dataset.locked = String(!complete);
    $('#badgeTitle').textContent = complete ? 'Curator badge: unlocked' : 'Curator badge: locked';
    $('#badgeText').textContent = complete
      ? 'You identified all six machines. The museum is yours to look after.'
      : `Identify all six machines to unlock it. ${total - doneSet.size} to go.`;
    if (announce) {
      toast(complete ? 'All six machines identified. Curator badge unlocked at the end of the museum.' : `Machine logged. ${total - doneSet.size} left to find.`);
    }
  }

  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function buildExhibit(ex) {
    const g = GALLERIES[ex.gallery];
    const root = document.createElement('article');
    root.className = 'exhibit reveal';
    root.id = `exhibit-${ex.id}`;
    root.dataset.state = 'mystery';
    root.style.setProperty('--accent', ex.accent || g.accent);
    root.innerHTML = `
      <div class="exhibit__stage">
        <div class="tag"><span>Exhibit ${ex.no}</span><span>${g.short}</span></div>
        <div class="specimen is-hidden">${ex.art()}</div>
        <div class="scan" aria-hidden="true"></div>
        <div class="floor" aria-hidden="true"></div>
        <div class="stamp" aria-hidden="true">Identified</div>
        <div class="placard"><span class="placard__id">${ex.no}</span><span class="placard__name" data-name>Unidentified machine</span></div>
      </div>
      <div class="exhibit__panel">
        <ol class="steps">${STAGES.map((s, k) => `<li><button type="button" class="step" data-step="${k}" ${k ? 'disabled' : ''}><i>${k + 1}</i><span>${s}</span></button></li>`).join('')}</ol>
        <div class="exhibit__body" aria-live="polite"></div>
        <div class="exhibit__nav">
          <button type="button" class="btn btn--ghost" data-prev disabled>Back</button>
          <button type="button" class="btn" data-next disabled>Next</button>
        </div>
      </div>`;

    const st = { step: 0, solved: false, wrong: 0, order: shuffle(ex.mystery.options.map((_, i) => i)) };
    const body = $('.exhibit__body', root);
    const stepBtns = $$('.step', root);
    const prev = $('[data-prev]', root);
    const next = $('[data-next]', root);
    const specimen = $('.specimen', root);
    const svg = $('svg', specimen);
    const nameEl = $('[data-name]', root);
    svg.setAttribute('aria-label', 'Silhouette of an unidentified machine');

    function setSolved() {
      st.solved = true;
      root.dataset.state = 'solved';
      specimen.classList.remove('is-hidden');
      svg.setAttribute('aria-label', `${ex.name}, illustration`);
      nameEl.textContent = ex.name;
      stepBtns.forEach(b => { b.disabled = false; });
    }

    function markDone(silent) {
      if (doneSet.has(ex.id)) return;
      doneSet.add(ex.id);
      store.set('mse-done', [...doneSet]);
      root.classList.add('is-done');
      updateLog(!silent);
    }

    const views = {
      0() {
        if (st.solved) {
          return `<p class="kicker">Stage 1: Mystery</p><h3>${ex.mystery.title}</h3>
            <ul class="clues">${ex.mystery.clues.map(c => `<li>${c}</li>`).join('')}</ul>
            <p class="solved">Identified as <strong>${ex.name}</strong></p>`;
        }
        return `<p class="kicker">Stage 1: Mystery</p><h3>${ex.mystery.title}</h3>
          <ul class="clues">${ex.mystery.clues.map(c => `<li>${c}</li>`).join('')}</ul>
          <p class="ask">What is this machine?</p>
          <div class="options" role="group" aria-label="Choose the machine">
            ${st.order.map((i, n) => `<button type="button" class="option" data-i="${i}"><b>${'ABC'[n]}</b>${ex.mystery.options[i]}</button>`).join('')}
          </div>
          <p class="feedback" role="status"></p>`;
      },
      1() {
        return `<p class="kicker">Stage 2: Discovery</p><h3>${ex.name}</h3><p class="alias">${ex.alias}</p>${ex.discovery}
          <div class="facts">${ex.facts.map(([v, l]) => `<div class="fact"><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
      },
      2() {
        return `<p class="kicker">Stage 3: Story</p><h3>${ex.storyTitle}</h3>${ex.story}
          <blockquote class="voice">&ldquo;${ex.voice}&rdquo;<small>In the machine's voice</small></blockquote>`;
      },
      3() {
        return `<p class="kicker">Stage 4: Science</p><h3>${ex.scienceTitle}</h3>${ex.science}`;
      },
      4() {
        return `<p class="kicker">Stage 5: Legacy</p><h3>${ex.legacyTitle}</h3>${ex.legacy}
          <h4>What future missions can learn</h4>
          <ul class="learn">${ex.learn.map(l => `<li>${l}</li>`).join('')}</ul>`;
      }
    };

    function bindMystery() {
      const fb = $('.feedback', body);
      $$('.option', body).forEach(btn => btn.addEventListener('click', () => {
        if (st.solved) return;
        const i = Number(btn.dataset.i);
        if (i === ex.mystery.answer) {
          btn.classList.add('is-correct');
          $$('.option', body).forEach(b => { b.disabled = true; });
          fb.textContent = 'Match confirmed. Identification complete.';
          setTimeout(() => { setSolved(); go(1); }, reduceMotion ? 0 : 1000);
        } else {
          st.wrong += 1;
          btn.classList.add('is-wrong');
          btn.disabled = true;
          fb.textContent = st.wrong === 1 ? 'No match. Read the clues again.' : `Still no match. Hint: ${ex.mystery.nudge}`;
          if (st.wrong >= 3 && !$('.reveal-btn', body)) {
            const r = document.createElement('button');
            r.type = 'button'; r.className = 'btn btn--ghost reveal-btn'; r.textContent = 'Reveal the machine';
            r.addEventListener('click', () => { setSolved(); go(1); });
            body.appendChild(r);
          }
        }
      }));
    }

    function go(k, userInitiated) {
      st.step = k;
      stepBtns.forEach((b, i) => {
        b.classList.toggle('is-active', i === k);
        b.classList.toggle('is-seen', i < k || (i === 0 && st.solved));
        if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      body.innerHTML = views[k]();
      body.classList.remove('swap'); void body.offsetWidth; body.classList.add('swap');
      if (k === 0 && !st.solved) bindMystery();
      prev.disabled = k === 0;
      next.disabled = k === 0 && !st.solved;
      next.textContent = k === STAGES.length - 1 ? 'Next exhibit' : 'Next';
      if (k === STAGES.length - 1) markDone(false);
      if (userInitiated) root.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    stepBtns.forEach((b, i) => b.addEventListener('click', () => { if (!b.disabled) go(i); }));
    prev.addEventListener('click', () => go(Math.max(0, st.step - 1)));
    next.addEventListener('click', () => {
      if (st.step < STAGES.length - 1) { go(st.step + 1); return; }
      const idx = exhibitRoots.indexOf(root);
      const target = exhibitRoots[idx + 1] || $('#timeline');
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    // gentle tilt that follows the pointer
    const stage = $('.exhibit__stage', root);
    if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        specimen.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
        specimen.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
      });
      stage.addEventListener('pointerleave', () => { specimen.style.setProperty('--ry', '0deg'); specimen.style.setProperty('--rx', '0deg'); });
    }

    // returning visitor: already identified
    if (doneSet.has(ex.id)) {
      setSolved();
      root.classList.add('is-done', 'no-anim');
      go(1);
    } else {
      go(0);
    }
    return root;
  }

  function initExhibits() {
    EXHIBITS.forEach(ex => {
      const host = $(`.exhibits[data-gallery="${ex.gallery}"]`);
      const root = buildExhibit(ex);
      exhibitRoots.push(root);
      host.appendChild(root);
    });
    updateLog(false);
    observeReveals();
  }

  /* ---------- 8. clocks, timeline, why, epilogue ---------- */
  function initClocks() {
    const clocks = $$('.clock[data-since]');
    const tick = () => {
      const now = new Date();
      clocks.forEach(c => {
        const a = new Date(c.dataset.since);
        let y = now.getUTCFullYear() - a.getUTCFullYear();
        const anniv = n => Date.UTC(a.getUTCFullYear() + n, a.getUTCMonth(), a.getUTCDate(), a.getUTCHours(), a.getUTCMinutes(), a.getUTCSeconds());
        if (anniv(y) > now.getTime()) y -= 1;
        const rem = now.getTime() - anniv(y);
        const d = Math.floor(rem / 864e5);
        const h = Math.floor(rem % 864e5 / 36e5);
        const m = Math.floor(rem % 36e5 / 6e4);
        const s = Math.floor(rem % 6e4 / 1e3);
        $('.clock__time', c).innerHTML = `${y}<small>years</small>${pad(d, 3)}<small>days</small>${pad(h)}:${pad(m)}:${pad(s)}`;
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  function initTimeline() {
    const items = [
      ['1969', 'Apollo 11 leaves the first laser reflector', 'Placed near the landing site. Scientists are still bouncing lasers off reflectors like it.', 'moon'],
      ['1971', 'The first Moon buggy hits the road', 'Apollo 15 drives the first Lunar Roving Vehicle across the Hadley-Apennine region.', 'moon'],
      ['1972', 'Apollo 17 parks the last rover', 'The crew lifts off in December. Three rovers have been waiting on the Moon ever since.', 'moon'],
      ['1977', 'Voyager 2 and Voyager 1 launch', 'Each carries a Golden Record, a message from Earth to anyone who finds it.', 'deep'],
      ['1990', 'The Pale Blue Dot', 'Voyager 1 looks back and photographs Earth as a speck from about 6 billion km away.', 'deep'],
      ['2004', 'Spirit and Opportunity land', 'Two rovers, each planned for 90 Martian days, on opposite sides of Mars.', 'mars'],
      ['2010', 'Spirit says goodbye', 'Stuck in sand and starved of winter sunlight, it sends its last signal in March.', 'mars'],
      ['2012', 'Voyager 1 enters interstellar space', 'The first human-made object to cross the edge of the Sun\u2019s influence.', 'deep'],
      ['2018', 'A dust storm silences Opportunity', 'Sunlight fades across the planet. The last signal arrives on 10 June.', 'mars'],
      ['2018', 'Voyager 2 follows', 'In November the second twin crosses into interstellar space.', 'deep'],
      ['2019', 'Mission complete', 'After 14 years, NASA declares the Opportunity mission over.', 'mars']
    ];
    $('#timelineList').innerHTML = items.map(([y, t, p, g]) =>
      `<li style="--c:var(--${g})"><time>${y}</time><h3>${t}</h3><p>${p}</p></li>`).join('');
  }

  function initWhy() {
    $$('.reason__btn').forEach(btn => btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.closest('.reason').classList.toggle('is-open', !open);
    }));
  }

  function initEpilogue() {
    const form = $('#transmit');
    const area = $('#msg');
    const counter = $('#msgCount');
    const list = $('#txList');
    let sent = store.get('mse-msgs', []);

    const render = () => {
      list.innerHTML = '';
      sent.forEach(item => {
        const li = document.createElement('li');
        const p = document.createElement('p'); p.className = 'tx__text'; p.textContent = `\u201C${item.text}\u201D`;
        const m = document.createElement('p'); m.className = 'tx__meta';
        m.textContent = `Transmitted ${item.date}. Estimated arrival at the star Gliese 445: about 40,000 years.`;
        li.append(p, m); list.appendChild(li);
      });
    };
    render();

    area.addEventListener('input', () => { counter.textContent = `${area.value.length} / 140`; });

    function launch(fromEl) {
      if (reduceMotion || !fromEl.animate) return Promise.resolve();
      const r = fromEl.getBoundingClientRect();
      const sx = r.left + r.width / 2, sy = r.top + r.height / 2;
      const dot = document.createElement('div');
      dot.className = 'packet';
      document.body.appendChild(dot);
      const anim = dot.animate([
        { transform: `translate(${sx}px, ${sy}px) scale(1)`, opacity: 1 },
        { transform: `translate(${sx + window.innerWidth * 0.18}px, ${sy - window.innerHeight * 0.95}px) scale(.2)`, opacity: 0 }
      ], { duration: 1700, easing: 'cubic-bezier(.3,.1,.2,1)' });
      return anim.finished.then(() => dot.remove(), () => dot.remove());
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const text = area.value.trim();
      if (!text) { area.focus(); return; }
      await launch(area);
      const date = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      sent = [{ text, date }, ...sent].slice(0, 5);
      store.set('mse-msgs', sent);
      render();
      area.value = ''; counter.textContent = '0 / 140';
      toast('Transmission sent. It is travelling at the speed of light.');
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initStarfield();
    initNav();
    initIntro();
    initExhibits();
    initClocks();
    initTimeline();
    initWhy();
    initEpilogue();
    observeReveals();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
