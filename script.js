const THEME_FALLBACK_RGB = [79, 142, 255];
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$';
const initializedParticles = new Set();

function hexToRgb(value) {
  const hex = value.trim().replace('#', '');
  if (hex.length === 3) return hex.split('').map(char => parseInt(char + char, 16));
  if (hex.length === 6) return [0, 2, 4].map(start => parseInt(hex.slice(start, start + 2), 16));
  return THEME_FALLBACK_RGB;
}

function mixRgb(rgb, targetRgb, amount) {
  return rgb.map((channel, index) => Math.round((channel * (1 - amount)) + (targetRgb[index] * amount)));
}

function cssRgb(rgb, alpha = null) {
  return alpha === null ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function getThemeRgb() {
  return hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--theme-color'));
}

function applyThemeColor() {
  const root = document.documentElement;
  const themeRgb = getThemeRgb();
  const accent2 = mixRgb(themeRgb, [255, 255, 255], 0.42);
  root.style.setProperty('--bg', cssRgb(mixRgb(themeRgb, [5, 6, 11], 0.91)));
  root.style.setProperty('--card', cssRgb(mixRgb(themeRgb, [16, 18, 29], 0.9)));
  root.style.setProperty('--card2', cssRgb(mixRgb(themeRgb, [21, 24, 39], 0.87)));
  root.style.setProperty('--accent2', cssRgb(accent2));
  root.style.setProperty('--green', cssRgb(mixRgb(themeRgb, [66, 245, 168], 0.55)));
  [['--theme-05', 0.05], ['--theme-08', 0.08], ['--theme-10', 0.1], ['--theme-14', 0.14], ['--theme-30', 0.3], ['--theme-85', 0.85]].forEach(([name, alpha]) => root.style.setProperty(name, cssRgb(themeRgb, alpha)));
  root.style.setProperty('--accent-soft', cssRgb(accent2, 0.5));
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
  const particles = { home: 'particlesHome', games: 'particlesGames', communities: 'particlesComm', contact: 'particlesContact' };
  const titles = { games: 'titleGames', communities: 'titleComm', contact: 'titleContact' };
  if (particles[pageId]) setTimeout(() => initParticles(particles[pageId]), 40);
  if (titles[pageId]) setTimeout(() => scrambleTitle(document.getElementById(titles[pageId])), 100);
}

function initParticles(id) {
  const canvas = document.getElementById(id);
  if (!canvas || initializedParticles.has(id)) return;
  initializedParticles.add(id);
  const ctx = canvas.getContext('2d');
  const particleRgb = mixRgb(getThemeRgb(), [255, 255, 255], 0.42);
  let width = 0, height = 0, particles = [];
  const createParticle = () => ({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.3, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, op: Math.random() * 0.42 + 0.06 });
  function resize() { width = canvas.width = canvas.parentElement.offsetWidth; height = canvas.height = canvas.parentElement.offsetHeight; particles = Array.from({ length: 110 }, createParticle); }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = cssRgb(particleRgb, p.op); ctx.fill(); p.x += p.vx; p.y += p.vy; if (p.x < -2) p.x = width + 2; if (p.x > width + 2) p.x = -2; if (p.y < -2) p.y = height + 2; if (p.y > height + 2) p.y = -2; });
    requestAnimationFrame(draw);
  }
  resize(); window.addEventListener('resize', resize); draw();
}

function animateStats() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => { const target = parseInt(el.dataset.target, 10); let current = 0; const step = target / 40; const timer = setInterval(() => { current = Math.min(current + step, target); el.textContent = Math.round(current); if (current >= target) clearInterval(timer); }, 30); });
}

function scrambleTitle(element) {
  if (!element) return;
  const original = element.dataset.text || element.textContent;
  element.dataset.text = original;
  let iteration = 0;
  const timer = setInterval(() => { element.textContent = original.split('').map((char, index) => index < iteration ? original[index] : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]).join(''); if (iteration >= original.length) { clearInterval(timer); element.textContent = original; } iteration += 0.4; }, 40);
}

function initSite() {
  applyThemeColor(); initParticles('particlesHome'); setTimeout(animateStats, 800);
  document.addEventListener('click', event => { const link = event.target.closest('[data-page]'); if (!link) return; event.preventDefault(); navigate(link.dataset.page); });
  window.addEventListener('scroll', () => { const nav = document.getElementById('mainNav'); const home = document.getElementById('page-home'); if (nav && home && home.classList.contains('active')) nav.classList.toggle('solid', window.scrollY > 30); });
  document.querySelectorAll('#heroTitle, #titleGames, #titleComm, #titleContact').forEach(title => title.addEventListener('mouseenter', () => scrambleTitle(title)));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSite);
else initSite();
