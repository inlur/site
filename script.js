function navigate(pageId) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('[data-page]').forEach(a => a.classList.remove('active'));
      document.getElementById('page-' + pageId).classList.add('active');
      document.querySelectorAll('[data-page="' + pageId + '"]').forEach(a => a.classList.add('active'));
      window.scrollTo(0, 0);
      mainNav.classList.toggle('solid', pageId !== 'home');

      const pmap = { home: 'particlesHome', games: 'particlesGames', communities: 'particlesComm', contact: 'particlesContact' };
      if (pmap[pageId]) setTimeout(() => initParticles(pmap[pageId]), 40);
      const tmap = { games: 'titleGames', communities: 'titleComm', contact: 'titleContact' };
      if (tmap[pageId]) setTimeout(() => scrambleTitle(document.getElementById(tmap[pageId])), 100);
    }

    document.addEventListener('click', e => {
      const link = e.target.closest('[data-page]');
      if (!link) return;
      const page = link.dataset.page;
      if (page) { e.preventDefault(); navigate(page); }
    });

    const mainNav = document.getElementById('mainNav');
    window.addEventListener('scroll', () => {
      const onHome = document.getElementById('page-home').classList.contains('active');
      if (onHome) mainNav.classList.toggle('solid', window.scrollY > 30);
    });

    const _particles = {};
    function getThemeRgb() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
      const hex = raw.replace('#', '');

      if (hex.length === 3) {
        return hex.split('').map(char => parseInt(char + char, 16));
      }

      if (hex.length === 6) {
        return [0, 2, 4].map(start => parseInt(hex.slice(start, start + 2), 16));
      }

      return [79, 142, 255];
    }

    function getParticleRgb() {
      const themeRgb = getThemeRgb();
      return themeRgb.map(channel => Math.round((channel * 0.58) + (255 * 0.42)));
    }

    function initParticles(id) {
      const canvas = document.getElementById(id);
      if (!canvas || _particles[id]) return;
      _particles[id] = true;
      const ctx = canvas.getContext('2d');
      const particleRgb = getParticleRgb();
      let W, H, P = [];
      function resize() {
        W = canvas.width = canvas.parentElement.offsetWidth;
        H = canvas.height = canvas.parentElement.offsetHeight;
        P = []; for (let i = 0; i < 110; i++) P.push(mk());
      }
      function mk() { return { x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.3, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, op: Math.random() * .42 + .06 }; }
      resize();
      window.addEventListener('resize', resize);
      (function draw() {
        ctx.clearRect(0, 0, W, H);
        P.forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${particleRgb[0]},${particleRgb[1]},${particleRgb[2]},${p.op})`; ctx.fill();
          p.x += p.vx; p.y += p.vy;
          if (p.x < -2) p.x = W + 2; if (p.x > W + 2) p.x = -2;
          if (p.y < -2) p.y = H + 2; if (p.y > H + 2) p.y = -2;
        });
        requestAnimationFrame(draw);
      })();
    }
    initParticles('particlesHome');

    setTimeout(() => {
      document.querySelectorAll('.stat-num[data-target]').forEach(el => {
        const t = parseInt(el.dataset.target); let c = 0; const s = t / 40;
        const ti = setInterval(() => { c = Math.min(c + s, t); el.textContent = Math.round(c); if (c >= t) clearInterval(ti); }, 30);
      });
    }, 800);

    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$';
    function scrambleTitle(el) {
      if (!el) return;
      const orig = el.dataset.text || el.textContent;
      el.dataset.text = orig;
      let iter = 0, timer;
      clearInterval(timer);
      timer = setInterval(() => {
        el.textContent = orig.split('').map((c, i) => i < iter ? orig[i] : CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
        if (iter >= orig.length) { clearInterval(timer); el.textContent = orig; }
        iter += 0.4;
      }, 40);
    }
    const ht = document.getElementById('heroTitle');
    if (ht) ht.addEventListener('mouseenter', () => scrambleTitle(ht));
    ['titleGames', 'titleComm', 'titleContact'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('mouseenter', () => scrambleTitle(el));
    });
