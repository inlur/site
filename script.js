const THEME_FALLBACK_RGB = [79, 142, 255];

function hexToRgb(value) {
  const hex = value.trim().replace('#', '');

  if (hex.length === 3) {
    return hex.split('').map(char => parseInt(char + char, 16));
  }

  if (hex.length === 6) {
    return [0, 2, 4].map(start => parseInt(hex.slice(start, start + 2), 16));
  }

  return THEME_FALLBACK_RGB;
}

function mixRgb(rgb, targetRgb, amount) {
  return rgb.map((channel, index) => Math.round((channel * (1 - amount)) + (targetRgb[index] * amount)));
}

function rgbString(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function rgbaString(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function applyThemeColor() {
  const root = document.documentElement;
  const themeRgb = hexToRgb(getComputedStyle(root).getPropertyValue('--theme-color'));
  const accent2 = mixRgb(themeRgb, [255, 255, 255], 0.42);

  root.style.setProperty('--bg', rgbString(mixRgb(themeRgb, [5, 6, 11], 0.91)));
  root.style.setProperty('--card', rgbString(mixRgb(themeRgb, [16, 18, 29], 0.9)));
  root.style.setProperty('--card2', rgbString(mixRgb(themeRgb, [21, 24, 39], 0.87)));
  root.style.setProperty('--accent2', rgbString(accent2));
  root.style.setProperty('--green', rgbString(mixRgb(themeRgb, [66, 245, 168], 0.55)));
  root.style.setProperty('--theme-05', rgbaString(themeRgb, 0.05));
  root.style.setProperty('--theme-08', rgbaString(themeRgb, 0.08));
  root.style.setProperty('--theme-10', rgbaString(themeRgb, 0.1));
  root.style.setProperty('--theme-14', rgbaString(themeRgb, 0.14));
  root.style.setProperty('--theme-30', rgbaString(themeRgb, 0.3));
  root.style.setProperty('--theme-85', rgbaString(themeRgb, 0.85));
  root.style.setProperty('--accent-soft', rgbaString(accent2, 0.5));
}

applyThemeColor();
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
