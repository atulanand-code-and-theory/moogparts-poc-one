const MOOG_BASE = 'https://www.moogparts.com';
const WORKER_BASE = 'https://moogparts-catalog-api.atul-code-auth0.workers.dev';
const DEFAULT_API_URL = `${WORKER_BASE}/cross-sell?q=all`;
const MAX_ITEMS = 2;

function normalizeToWorker(raw) {
  try {
    const u = new URL(raw);
    if (u.hostname === 'www.moogparts.com' && u.pathname.includes('cross_sell')) {
      const worker = new URL(`${WORKER_BASE}/cross-sell`);
      u.searchParams.forEach((v, k) => {
        if (k !== 'nocache' && k !== 'no_cache') worker.searchParams.set(k, v);
      });
      return worker.toString();
    }
  } catch { /* not a full URL, return as-is */ }
  return raw;
}

function resolveImageUrl(path) {
  if (!path) return null;
  return path.startsWith('/') ? `${MOOG_BASE}${path}` : path;
}

function buildItem(item) {
  const el = document.createElement('div');
  el.className = 'cs-item';

  const imageUrl = resolveImageUrl(item.imagePath);
  if (imageUrl) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'cs-img';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = item.ledeTitle || '';
    img.loading = 'lazy';
    imgWrap.appendChild(img);
    el.appendChild(imgWrap);
  }

  const title = document.createElement('h3');
  title.textContent = item.ledeTitle || '';
  el.appendChild(title);

  if (item.description) {
    const desc = document.createElement('p');
    desc.textContent = item.description;
    el.appendChild(desc);
  }

  if (item.ctaPath) {
    const cta = document.createElement('a');
    cta.href = item.ctaPath;
    cta.className = 'cs-cta';
    cta.textContent = `View ${item.ctaLabel || item.ledeTitle || ''} »`;
    el.appendChild(cta);
  }

  return el;
}

export default async function decorate(block) {
  const configUrl = normalizeToWorker(
    block.querySelector('a')?.href || block.textContent?.trim() || DEFAULT_API_URL,
  );

  block.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'cs-header';
  const heading = document.createElement('h2');
  heading.textContent = 'Other Parts For Your Vehicle';
  const tagline = document.createElement('p');
  tagline.innerHTML = 'MOOG<sup>®</sup> offers a wide variety of auto parts for all your vehicle needs.<br>Check them out today!';
  header.append(heading, tagline);
  block.appendChild(header);

  const itemsEl = document.createElement('div');
  itemsEl.className = 'cs-items';
  block.appendChild(itemsEl);

  try {
    const res = await fetch(configUrl);
    if (!res.ok) throw new Error(`Cross-sell API failed: ${res.status}`);
    const json = await res.json();
    const items = (json.data || []).slice(0, MAX_ITEMS);

    items.forEach((item) => {
      itemsEl.appendChild(buildItem(item));
    });
  } catch {
    itemsEl.remove();
  }
}
