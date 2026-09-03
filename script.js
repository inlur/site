const REFRESH_INTERVAL = 60_000;

if (window.location.protocol.startsWith('http') && window.location.pathname.endsWith('/index.html')) {
  history.replaceState(null, '', `${window.location.pathname.slice(0, -10)}${window.location.hash}`);
}
const API = {
  universe: placeId => `https://apis.roproxy.com/universes/v1/places/${placeId}/universe`,
  placeDetails: ids => `https://games.roproxy.com/v1/games/multiget-place-details?placeIds=${ids.join(',')}`,
  games: ids => `https://games.roproxy.com/v1/games?universeIds=${ids.join(',')}`,
  icons: ids => `https://thumbnails.roproxy.com/v1/games/icons?universeIds=${ids.join(',')}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`,
  thumbnails: ids => `https://thumbnails.roproxy.com/v1/games/multiget/thumbnails?universeIds=${ids.join(',')}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`,
  groupIcons: ids => `https://thumbnails.roproxy.com/v1/groups/icons?groupIds=${ids.join(',')}&size=150x150&format=Png&isCircular=false`,
  group: id => `https://groups.roproxy.com/v1/groups/${id}`
};

const FALLBACK_GAMES = [
  { placeId:'140644961354094', universeId:null, title:'Pillow Battles', link:'https://www.roblox.com/games/140644961354094/Pillow-Battles', accent:'white', groupId:'1090676297' },
  { placeId:'86670564972916', universeId:null, title:'Guess My Cup', link:'https://www.roblox.com/games/86670564972916/Guess-My-Cup', accent:'white', groupId:'1018786782' },
  { placeId:'108810211502353', universeId:null, title:'Wall Hop Royale', link:'https://www.roblox.com/games/108810211502353/Wall-Hop-Royale', accent:'white', groupId:'422808508' },
  { placeId:'124278191684019', universeId:null, title:'Find The 0.1% Needle!', link:'https://www.roblox.com/games/124278191684019/Find-The-0-1-Needle', accent:'white', groupId:'158767345' }
];

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const exact = new Intl.NumberFormat('en');
const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

let games = [];
let resolvedGames = [];
let latestStats = new Map();
let latestImages = new Map();
let activeSort = 'playing';

function ensureGroupRecords(groupData = []) {
  const container = document.getElementById('groups-container');
  if (!container) return;
  const details = new Map(groupData.map(group => [String(group.id), group]));
  const groupIds = [...new Set(games.map(game => String(game.groupId || '')).filter(Boolean))];

  groupIds.forEach(groupId => {
    if (container.querySelector(`[data-group-id="${groupId}"]`)) return;
    const group = details.get(groupId) || {};
    const name = group.name || `Roblox Group ${groupId}`;
    container.insertAdjacentHTML('beforeend', `<article data-group-id="${escapeHTML(groupId)}" class="group-record py-12"><div class="flex flex-col items-center justify-between gap-7 text-center sm:flex-row sm:text-left"><div><h3 class="text-2xl font-extrabold tracking-[-.04em] sm:text-4xl">${escapeHTML(name)}</h3></div><a href="https://www.roblox.com/communities/${escapeHTML(groupId)}" target="_blank" rel="noreferrer" class="rounded-full border border-white/10 px-5 py-3 text-xs font-bold transition hover:bg-white hover:text-black">View group ↗</a></div><div class="mt-6 grid grid-cols-3 gap-4 pt-5 text-center sm:text-left"><div><strong class="group-games text-2xl font-extrabold">—</strong><p class="mt-2 text-xs text-zinc-600">Games</p></div><div class="pl-6"><strong class="group-visits text-2xl font-extrabold">—</strong><p class="mt-2 text-xs text-zinc-600">Total visits</p></div><div class="group-member-metric pl-3"><strong class="group-members text-2xl font-extrabold">—</strong><p class="mt-2 text-xs text-zinc-600">Members</p></div></div></article>`);
  });
  const summary = document.getElementById('summary-groups');
  if (summary) summary.textContent = groupIds.length;
}

async function loadPublishedStats() {
  if (window.location.protocol === 'file:') return false;
  try {
    const snapshot = await fetchJSON('./stats.json');
    if (!Array.isArray(snapshot.games) || !snapshot.games.length) return false;

    resolvedGames = games.map(game => {
      const saved = snapshot.games.find(item => String(item.placeId) === String(game.placeId));
      return { ...game, universeId: saved?.universeId ? String(saved.universeId) : game.universeId };
    });
    latestStats = new Map(snapshot.games.filter(item => item.universeId).map(item => [String(item.universeId), item]));
    latestImages = new Map(snapshot.games.filter(item => item.universeId && (item.thumbnailUrl || item.imageUrl)).map(item => [String(item.universeId), item.thumbnailUrl || item.imageUrl]));
    ensureGroupRecords(snapshot.groups || []);
    renderGames(resolvedGames, latestStats, latestImages);

    const memberTotal = (snapshot.groups || []).reduce((sum, group) => sum + (group.memberCount || 0), 0);
    document.getElementById('total-members').textContent = `${compact.format(memberTotal)}+`;
    document.getElementById('bottom-members').textContent = `${compact.format(memberTotal)}+`;
    document.getElementById('summary-members').textContent = `${compact.format(memberTotal)}+`;

    const groupMembers = new Map((snapshot.groups || []).map(group => [String(group.id), group.memberCount || 0]));
    document.querySelectorAll('.group-record').forEach((record, index) => {
      const metrics = record.querySelector('.group-games')?.closest('.grid');
      if (!metrics) return;
      metrics.classList.remove('grid-cols-2');
      metrics.classList.add('grid-cols-3');
      let memberMetric = metrics.querySelector('.group-member-metric');
      if (!memberMetric) {
        memberMetric = document.createElement('div');
        memberMetric.className = 'group-member-metric pl-6';
        memberMetric.innerHTML = '<strong class="group-members text-2xl font-extrabold">—</strong><p class="mt-2 text-xs text-zinc-600">Members</p>';
        metrics.appendChild(memberMetric);
      }
      const memberCount = groupMembers.get(record.dataset.groupId) ?? snapshot.groups?.[index]?.memberCount ?? 0;
      memberMetric.querySelector('.group-members').textContent = `${compact.format(memberCount)}+`;
    });

    const groupIcons = new Map((snapshot.groups || []).filter(group => group.imageUrl).map(group => [String(group.id), group.imageUrl]));
    document.querySelectorAll('.group-record').forEach(record => {
      let icon = record.querySelector('.group-icon');
      const imageUrl = groupIcons.get(record.dataset.groupId);
      if (!icon && imageUrl) {
        const heading = record.querySelector('h3');
        const row = document.createElement('div');
        row.className = 'flex items-center justify-center gap-4 sm:justify-start';
        icon = document.createElement('img');
        icon.className = 'group-icon';
        icon.alt = `${heading.textContent} group icon`;
        icon.loading = 'lazy';
        heading.parentElement.insertBefore(row, heading);
        row.append(icon, heading);
      }
      if (icon && imageUrl && icon.tagName === 'IMG') icon.src = imageUrl;
    });
    return true;
  } catch (error) {
    console.warn('Published stats snapshot unavailable:', error);
    return false;
  }
}

async function fetchJSON(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  const response = await fetch(url, { cache: 'no-store', signal: controller.signal }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function resolveUniverseIds(items) {
  const unresolved = items.filter(game => !game.universeId);
  let details = [];
  if (unresolved.length) {
    try { const response = await fetchJSON(API.placeDetails(unresolved.map(game => game.placeId))); details = Array.isArray(response) ? response : (response.data || []); } catch { details = []; }
  }
  return Promise.all(items.map(async game => {
    if (game.universeId) return { ...game, universeId: String(game.universeId) };
    const match = details.find(item => String(item.placeId) === String(game.placeId));
    if (match?.universeId) return { ...game, universeId: String(match.universeId) };
    try { const data = await fetchJSON(API.universe(game.placeId)); return { ...game, universeId: String(data.universeId) }; }
    catch { return { ...game, universeId: null }; }
  }));
}

function cardTemplate(game, stats = {}, imageUrl = '') {
  const palette = {
    white: 'from-white/15 via-zinc-500/10 to-transparent'
  }[game.accent] || 'from-white/15 to-transparent';
  const players = Number.isFinite(stats.playing) ? exact.format(stats.playing) : '—';
  const visits = Number.isFinite(stats.visits) ? compact.format(stats.visits) : '—';
  const art = imageUrl
    ? `<img class="game-art h-full w-full object-cover transition duration-700 ease-out" src="${escapeHTML(imageUrl)}" alt="${escapeHTML(game.title)} Roblox game icon" loading="lazy">`
    : `<div class="game-art h-full w-full bg-gradient-to-br ${palette} transition duration-700"><div class="grid h-full place-items-center text-7xl font-semibold text-white/10">${escapeHTML(game.title.charAt(0))}</div></div>`;

  const size = resolvedGames.length === 3
    ? (game === resolvedGames[0] ? 'md:col-span-2 lg:col-span-4 lg:row-span-2' : 'lg:col-span-2')
    : 'lg:col-span-3';
  return `<a class="game-card card-border group relative block overflow-hidden rounded-3xl bg-panel ${size} transition duration-500 hover:-translate-y-1 hover:shadow-[0_25px_80px_-30px_rgba(255,255,255,.16)]" href="${escapeHTML(game.link)}" target="_blank" rel="noreferrer">
    <div class="absolute inset-0 overflow-hidden bg-zinc-900">${art}<div class="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/5"></div></div>
    <div class="relative flex h-full flex-col justify-between p-5 sm:p-6"><div class="flex justify-end"><span class="arrow rounded-full border border-white/15 bg-black/55 px-3 py-2 text-sm backdrop-blur-md transition duration-300 group-hover:text-white">↗</span></div>
    <div><h3 class="text-xl font-semibold tracking-[-.03em] drop-shadow-md sm:text-2xl">${escapeHTML(game.title)}</h3><div class="mt-3 flex flex-wrap gap-4 text-xs text-zinc-300"><span><i class="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></i>${players} playing</span><span>${visits} visits</span></div></div></div>
  </a>`;
}

function renderGames(items, statsById = new Map(), iconsById = new Map()) {
  const container = document.getElementById('games-container');
  const sorted = [...items].sort((a,b) => (statsById.get(b.universeId)?.[activeSort] || 0) - (statsById.get(a.universeId)?.[activeSort] || 0));
  container.innerHTML = sorted.map(game => cardTemplate(game, statsById.get(game.universeId), iconsById.get(game.universeId))).join('');
  container.setAttribute('aria-busy', 'false');
  updatePortfolioStats(statsById);
}

function updatePortfolioStats(statsById = latestStats) {
  const allStats = resolvedGames.map(game => statsById.get(game.universeId) || {});
  const totalPlayers = allStats.reduce((sum, item) => sum + (item.playing || 0), 0);
  const totalVisits = allStats.reduce((sum, item) => sum + (item.visits || 0), 0);
  document.getElementById('total-players').textContent = `${compact.format(totalPlayers)}+`;
  document.getElementById('total-visits').textContent = `${compact.format(totalVisits)}+`;
  document.getElementById('summary-visits').textContent = `${compact.format(totalVisits)}+`;
  document.getElementById('summary-games').textContent = resolvedGames.length;
  document.getElementById('bottom-games').textContent = resolvedGames.length;
  document.getElementById('bottom-visits').textContent = `${compact.format(totalVisits)}+`;
  document.querySelectorAll('.group-record').forEach(record => {
    const groupGames = resolvedGames.filter(game => game.groupId === record.dataset.groupId);
    const visits = groupGames.reduce((sum, game) => sum + (statsById.get(game.universeId)?.visits || 0), 0);
    record.querySelector('.group-games').textContent = groupGames.length;
    record.querySelector('.group-visits').textContent = `${compact.format(visits)}+`;
    record.dataset.visits = visits;
  });
  const groupContainer = document.getElementById('groups-container');
  [...groupContainer.querySelectorAll('.group-record')]
    .sort((a, b) => Number(b.dataset.visits || 0) - Number(a.dataset.visits || 0))
    .forEach(record => groupContainer.appendChild(record));
}

async function refreshGameStats() {
  if (!resolvedGames.length) return;
  const ids = resolvedGames.map(game => game.universeId).filter(Boolean);
  if (!ids.length) { renderGames(resolvedGames); return; }
  try {
    const [statsResult, thumbResult, iconResult] = await Promise.allSettled([fetchJSON(API.games(ids)), fetchJSON(API.thumbnails(ids)), fetchJSON(API.icons(ids))]);
    latestStats = new Map(statsResult.status === 'fulfilled' ? statsResult.value.data.map(item => [String(item.id), item]) : []);
    latestImages = new Map();
    if (thumbResult.status === 'fulfilled') thumbResult.value.data.forEach(item => { const thumb = item.thumbnails?.[0]; if (thumb?.imageUrl) latestImages.set(String(item.universeId), thumb.imageUrl); });
    if (iconResult.status === 'fulfilled') iconResult.value.data.forEach(item => { if (!latestImages.has(String(item.targetId))) latestImages.set(String(item.targetId), item.imageUrl); });
    renderGames(resolvedGames, latestStats, latestImages);
  } catch (error) {
    console.warn('Game stats unavailable:', error);
    renderGames(resolvedGames);
  }
}

async function refreshGroupCounts() {
  const cards = [...document.querySelectorAll('[data-group-id]')];
  const results = await Promise.allSettled(cards.map(card => fetchJSON(API.group(card.dataset.groupId))));
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const card = cards[index];
    const heading = card.querySelector('h3');
    const members = card.querySelector('.group-members');
    if (heading && result.value.name) heading.textContent = result.value.name;
    if (members) members.textContent = `${compact.format(result.value.memberCount || 0)}+`;
  });
  const total = results.reduce((sum, result) => sum + (result.status === 'fulfilled' ? result.value.memberCount || 0 : 0), 0);
  document.getElementById('total-members').textContent = total ? `${compact.format(total)}+` : '—';
  document.getElementById('bottom-members').textContent = total ? `${compact.format(total)}+` : '—';
}

async function refreshGroupIcons() {
  const records = [...document.querySelectorAll('.group-record')];
  try {
    const response = await fetchJSON(API.groupIcons(records.map(record => record.dataset.groupId)));
    const icons = new Map((response.data || []).map(item => [String(item.targetId), item.imageUrl]));
    records.forEach(record => {
      const heading = record.querySelector('h3');
      if (!heading || record.querySelector('.group-icon')) return;
      const row = document.createElement('div');
      row.className = 'flex items-center justify-center gap-4 sm:justify-start';
      const iconUrl = icons.get(record.dataset.groupId);
      const icon = document.createElement(iconUrl ? 'img' : 'span');
      icon.className = 'group-icon grid place-items-center text-lg font-extrabold text-zinc-500';
      if (iconUrl) { icon.src = iconUrl; icon.alt = `${heading.textContent} group icon`; icon.loading = 'lazy'; }
      else { icon.textContent = heading.textContent.trim().charAt(0); icon.setAttribute('aria-hidden', 'true'); }
      heading.parentElement.insertBefore(row, heading);
      row.append(icon, heading);
    });
  } catch (error) { console.warn('Group icons unavailable:', error); }
}

async function initialize() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const discordButton = document.getElementById('discord-copy');
  if (discordButton) {
    discordButton.addEventListener('click', async event => {
      try { await navigator.clipboard.writeText('@inlurs'); event.currentTarget.textContent = 'Copied @inlurs ✓'; }
      catch { event.currentTarget.textContent = 'Discord · @inlurs'; }
      setTimeout(() => { event.currentTarget.textContent = 'Discord · @inlurs'; }, 1800);
    });
  }
  document.querySelectorAll('.sort-button').forEach(button => button.addEventListener('click', () => {
    activeSort = button.dataset.sort;
    document.querySelectorAll('.sort-button').forEach(item => item.className = 'sort-button rounded-full border border-white/10 px-5 py-2.5 text-xs font-bold text-zinc-400 transition hover:text-white');
    button.className = 'sort-button rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black';
    renderGames(resolvedGames, latestStats, latestImages);
  }));

  // Render useful content immediately. Live APIs enhance it afterwards.
  games = FALLBACK_GAMES;
  resolvedGames = FALLBACK_GAMES;
  renderGames(resolvedGames);
  document.getElementById('total-members').textContent = '0+';
  document.getElementById('bottom-members').textContent = '0+';

  try {
    if (window.location.protocol !== 'file:') {
      try { games = await fetchJSON('./games.json'); } catch { games = FALLBACK_GAMES; }
    }
    ensureGroupRecords();
    const hasPublishedStats = await loadPublishedStats();
    if (!hasPublishedStats) {
      resolvedGames = await resolveUniverseIds(games);
      await refreshGameStats();
      refreshGroupCounts();
      refreshGroupIcons();
    }
  } catch (error) {
    console.warn('Could not load live game data:', error);
    resolvedGames = games.length ? games : [];
    if (resolvedGames.length) renderGames(resolvedGames);
    else document.getElementById('games-container').innerHTML = '<p class="col-span-full rounded-3xl border border-white/10 p-8 text-zinc-400">Games are temporarily unavailable. Please check back shortly.</p>';
  }
  setInterval(async () => {
    const hasPublishedStats = await loadPublishedStats();
    if (!hasPublishedStats) {
      refreshGameStats();
      refreshGroupCounts();
    }
  }, REFRESH_INTERVAL);
}

initialize();
