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

function getThemeRgb() {
  return hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--theme-color'));
}

function applyThemeColor() {
  const root = document.documentElement;
  const themeRgb = getThemeRgb();
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

function navigate(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('[data-page]').forEach(link => link.classList.remove('active'));

  const page = document.getElementById(`page-${pageId}`);
  if (!page) return;

  page.classList.add('active');
  document.querySelectorAll(`[data-page="${pageId}"]`).forEach(link => link.classList.add('active'));
  window.scrollTo(0, 0);

  const mainNav = document.getElementById('mainNav');
  if (mainNav) mainNav.classList.toggle('solid', pageId !== 'home');

  const particleCanvasIds = {
    home: 'particlesHome',
    games: 'particlesGames',
    communities: 'particlesComm',
    contact: 'particlesContact'
  };

  const titleIds = {
    games: 'titleGames',
    communities: 'titleComm',
    contact: 'titleContact'
  };

  if (particleCanvasIds[pageId]) setTimeout(() => initParticles(particleCanvasIds[pageId]), 40);
  if (titleIds[pageId]) setTimeout(() => scrambleTitle(document.getElementById(titleIds[pageId])), 100);
}

const initializedParticles = new Set();

function getParticleRgb() {
  return mixRgb(getThemeRgb(), [255, 255, 255], 0.42);
}

function initParticles(id) {
  const canvas = document.getElementById(id);
  if (!canvas || initializedParticles.has(id)) return;

  initializedParticles.add(id);
  const ctx = canvas.getContext('2d');
  const particleRgb = getParticleRgb();
  let width = 0;
  let height = 0;
  let particles = [];

  function createParticle() {
