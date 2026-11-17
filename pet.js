/* Pupa — mažas ekrano augintinis. Įdėkite į bet kurį puslapį:
   <script defer src="./pet.js"></script>
   Seka pelę akimis, mirksi, užmiega, kai nieko nedarote, reaguoja į paspaudimą,
   stebi rašymą įvesties laukeliuose ir gali būti tempiamas. */
(() => {
  if (window.__pupaPet) return;
  window.__pupaPet = true;

  const PHRASES = {
    hello: ['Labas! 👋', 'Sveiki sugrįžę!', 'Aš čia, jei ko reikės.'],
    poke: ['Hehe, kutena!', 'Oi!', 'Dar kartą! 😄', 'Myliu tave ❤️', 'Bum!'],
    typing: ['Ką rašai? 👀', 'Įdomu…', 'Rašyk, rašyk, aš saugau.'],
    idle: ['Gal arbatos? ☕', 'Nepamiršk tepalų keitimo 🔧', 'Ar padangos pripūstos?', 'Aš tiesiog pabūsiu.'],
    wake: ['A? Aš nemiegojau!', 'Mmm… labas.'],
  };
  const pick = (k) => PHRASES[k][Math.floor(Math.random() * PHRASES[k].length)];

  const css = `
  .pupa{position:fixed;right:24px;bottom:24px;width:110px;height:120px;z-index:2147483000;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
  .pupa.dragging{cursor:grabbing}
  .pupa svg{width:100%;height:100%;overflow:visible;display:block}
  .pupa .body{transform-origin:55px 110px;animation:pupa-breathe 3.2s ease-in-out infinite}
  .pupa .tail{transform-origin:22px 92px;animation:pupa-wag 1.6s ease-in-out infinite}
  .pupa .lid{transform-origin:center;transform:scaleY(0);transition:transform .08s}
  .pupa.blink .lid,.pupa.sleep .lid{transform:scaleY(1)}
  .pupa.sleep .body{animation-duration:5s}
  .pupa.sleep .tail{animation:none}
  .pupa.jump .body{animation:pupa-jump .55s cubic-bezier(.3,1.6,.5,1)}
  .pupa.happy .mouth{d:path("M45 74 Q55 86 65 74")}
  .pupa .cheek{opacity:.0;transition:opacity .3s}
  .pupa.happy .cheek,.pupa.typing .cheek{opacity:.55}
  .pupa-bubble{position:absolute;bottom:112%;right:10px;max-width:200px;width:max-content;background:var(--pupa-bubble-bg,#fff);color:var(--pupa-bubble-fg,#1d2b22);font:500 13px/1.35 'Segoe UI',system-ui,sans-serif;padding:8px 12px;border-radius:14px 14px 4px 14px;box-shadow:0 6px 20px #0003;opacity:0;transform:translateY(6px) scale(.95);transition:.2s;pointer-events:none}
  .pupa-bubble.show{opacity:1;transform:none}
  .pupa-z{position:absolute;top:0;right:4px;font:700 16px system-ui;color:#9fc7b3;opacity:0;pointer-events:none}
  .pupa.sleep .pupa-z{animation:pupa-z 2.4s ease-in-out infinite}
  .pupa-heart{position:fixed;pointer-events:none;font-size:18px;z-index:2147483001;animation:pupa-heart 1s ease-out forwards}
  @keyframes pupa-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.97)}}
  @keyframes pupa-wag{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(14deg)}}
  @keyframes pupa-jump{0%{transform:scale(1.1,.85)}40%{transform:translateY(-28px) scale(.95,1.08)}100%{transform:none}}
  @keyframes pupa-z{0%{opacity:0;transform:translate(0,0) scale(.7)}30%{opacity:1}100%{opacity:0;transform:translate(14px,-30px) scale(1.2)}}
  @keyframes pupa-heart{0%{opacity:1;transform:translate(0,0) scale(.6)}100%{opacity:0;transform:translate(var(--dx),-60px) scale(1.3)}}
  @media (prefers-reduced-motion:reduce){.pupa .body,.pupa .tail,.pupa.sleep .pupa-z{animation:none}}
  @media (max-width:480px){.pupa{width:84px;height:92px;right:12px;bottom:84px}}`;

  // Originalus personažas: apvalus žalias padarėlis su ausytėmis, uodega ir mechaniko kepuraite.
  const svg = `
  <svg viewBox="0 0 110 120" aria-hidden="true">
    <ellipse cx="55" cy="114" rx="34" ry="5" fill="#000" opacity=".25"/>
    <g class="body">
      <path class="tail" d="M24 92 Q2 88 8 68 Q12 60 18 66 Q14 78 28 84 Z" fill="#2f9c70"/>
      <path d="M26 40 L20 14 L42 30 Z" fill="#2f9c70"/><path d="M27 34 L24 20 L36 30 Z" fill="#ffb3a7"/>
      <path d="M84 40 L90 14 L68 30 Z" fill="#2f9c70"/><path d="M83 34 L86 20 L74 30 Z" fill="#ffb3a7"/>
      <ellipse cx="55" cy="72" rx="38" ry="40" fill="#3cb883"/>
      <ellipse cx="55" cy="88" rx="24" ry="20" fill="#bfeedb"/>
      <path d="M24 42 Q55 16 86 42 L86 46 Q55 34 24 46 Z" fill="#f2b33d"/>
      <path d="M58 44 Q80 40 96 50 Q84 54 64 49 Z" fill="#d9952a"/>
      <circle cx="55" cy="27" r="4" fill="#d9952a"/>
      <g class="eye" data-cx="41" data-cy="62">
        <ellipse cx="41" cy="62" rx="9" ry="10" fill="#fff"/>
        <circle class="pupil" cx="41" cy="63" r="5" fill="#1b2a22"/>
        <circle class="shine" cx="43" cy="60" r="1.6" fill="#fff"/>
        <rect class="lid" x="31" y="51" width="20" height="21" rx="9" fill="#3cb883" style="transform-box:fill-box"/>
      </g>
      <g class="eye" data-cx="69" data-cy="62">
        <ellipse cx="69" cy="62" rx="9" ry="10" fill="#fff"/>
        <circle class="pupil" cx="69" cy="63" r="5" fill="#1b2a22"/>
        <circle class="shine" cx="71" cy="60" r="1.6" fill="#fff"/>
        <rect class="lid" x="59" y="51" width="20" height="21" rx="9" fill="#3cb883" style="transform-box:fill-box"/>
      </g>
      <ellipse class="cheek" cx="30" cy="76" rx="6" ry="3.5" fill="#ff7d8c"/>
      <ellipse class="cheek" cx="80" cy="76" rx="6" ry="3.5" fill="#ff7d8c"/>
      <path class="mouth" d="M48 76 Q55 81 62 76" stroke="#1b2a22" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="34" cy="108" rx="10" ry="6" fill="#2f9c70"/>
      <ellipse cx="76" cy="108" rx="10" ry="6" fill="#2f9c70"/>
    </g>
  </svg>`;

  const init = () => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const pet = document.createElement('div');
    pet.className = 'pupa';
    pet.setAttribute('role', 'img');
    pet.setAttribute('aria-label', 'Augintinis Pupa');
    pet.innerHTML = svg + '<div class="pupa-bubble"></div><div class="pupa-z">z</div>';
    document.body.appendChild(pet);

    const bubble = pet.querySelector('.pupa-bubble');
    const eyes = [...pet.querySelectorAll('.eye')];
    let bubbleTimer, lastActive = Date.now(), asleep = false;

    // Atkurti vietą, jei buvo nutemptas
    try {
      const pos = JSON.parse(localStorage.getItem('pupa-pos') || 'null');
      if (pos) { pet.style.left = Math.min(pos.x, innerWidth - 90) + 'px'; pet.style.top = Math.min(pos.y, innerHeight - 100) + 'px'; pet.style.right = pet.style.bottom = 'auto'; }
    } catch (e) {}

    const say = (text, ms = 2600) => {
      bubble.textContent = text;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
    };
    const flash = (cls, ms) => { pet.classList.add(cls); setTimeout(() => pet.classList.remove(cls), ms); };

    const lookAt = (x, y) => {
      eyes.forEach((eye) => {
        const r = eye.getBoundingClientRect();
        const ex = r.left + r.width / 2, ey = r.top + r.height / 2;
        const a = Math.atan2(y - ey, x - ex);
        const d = Math.min(3.5, Math.hypot(x - ex, y - ey) / 40);
        const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
        eye.querySelector('.pupil').setAttribute('transform', `translate(${dx} ${dy})`);
        eye.querySelector('.shine').setAttribute('transform', `translate(${dx} ${dy})`);
      });
    };

    const wake = () => {
      lastActive = Date.now();
      if (asleep) { asleep = false; pet.classList.remove('sleep'); say(pick('wake')); }
    };

    // Mirksėjimas
    (function blink() {
      setTimeout(() => { if (!asleep) flash('blink', 140); blink(); }, 2500 + Math.random() * 3500);
    })();

    // Užmigimas ir atsitiktinės frazės
    setInterval(() => {
      const idle = Date.now() - lastActive;
      if (!asleep && idle > 30000) { asleep = true; pet.classList.add('sleep'); bubble.classList.remove('show'); }
      else if (!asleep && idle > 12000 && Math.random() < 0.15) say(pick('idle'));
    }, 3000);

    addEventListener('pointermove', (e) => { wake(); if (!dragging) lookAt(e.clientX, e.clientY); }, { passive: true });
    addEventListener('keydown', wake);

    // Stebi rašymą
    let typingTimer;
    document.addEventListener('input', (e) => {
      const t = e.target;
      if (!t.matches || !t.matches('input,textarea,[contenteditable]')) return;
      wake();
      const r = t.getBoundingClientRect();
      lookAt(r.left + r.width / 2, r.top + r.height / 2);
      if (!pet.classList.contains('typing')) { pet.classList.add('typing'); if (Math.random() < 0.4) say(pick('typing')); }
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => pet.classList.remove('typing'), 1200);
    });

    // Tempimas ir paspaudimas
    let dragging = false, moved = false, sx, sy, ox, oy;
    pet.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false; sx = e.clientX; sy = e.clientY;
      const r = pet.getBoundingClientRect(); ox = r.left; oy = r.top;
      pet.setPointerCapture(e.pointerId);
    });
    pet.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true; pet.classList.add('dragging');
      const x = Math.max(0, Math.min(innerWidth - pet.offsetWidth, ox + dx));
      const y = Math.max(0, Math.min(innerHeight - pet.offsetHeight, oy + dy));
      Object.assign(pet.style, { left: x + 'px', top: y + 'px', right: 'auto', bottom: 'auto' });
    });
    pet.addEventListener('pointerup', (e) => {
      dragging = false; pet.classList.remove('dragging');
      if (moved) {
        try { localStorage.setItem('pupa-pos', JSON.stringify({ x: parseFloat(pet.style.left), y: parseFloat(pet.style.top) })); } catch (err) {}
        return;
      }
      wake();
      flash('jump', 560); flash('happy', 1500);
      say(pick('poke'));
      for (let i = 0; i < 4; i++) {
        const h = document.createElement('span');
        h.className = 'pupa-heart'; h.textContent = '❤️';
        h.style.left = e.clientX - 9 + 'px'; h.style.top = e.clientY - 18 + 'px';
        h.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
        h.style.animationDelay = i * 80 + 'ms';
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 1300);
      }
    });
    pet.addEventListener('dblclick', () => {
      pet.style.left = pet.style.top = ''; pet.style.right = pet.style.bottom = '';
      try { localStorage.removeItem('pupa-pos'); } catch (e) {}
    });

    setTimeout(() => say(pick('hello')), 700);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
