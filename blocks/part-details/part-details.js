const WORKER_BASE = 'https://moogparts-catalog-api.atul-code-auth0.workers.dev';
const API_BASE = `${WORKER_BASE}/catalog`;
const MOOG_ASSET_BASE = 'https://www.moogparts.com';
const API_PARAMS = { brand: 'moog', locale: 'en_US', country_code: 'US' };

function resolveImageUrl(url) {
  if (!url) return null;
  return url.startsWith('/') ? `${MOOG_ASSET_BASE}${url}` : url;
}

function findDesc(descriptions, typeCode) {
  return descriptions?.find((d) => d.type_code === typeCode);
}

async function fetchPartDetails(partNumber, brandCode) {
  const params = {
    ...API_PARAMS,
    part_number: partNumber,
    brand_code: brandCode,
    brand_codes: brandCode,
  };
  const makeUrl = (endpoint) => {
    const url = new URL(`${API_BASE}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  };
  const [productRes, appsRes] = await Promise.all([
    fetch(makeUrl('api.catalog.product')),
    fetch(makeUrl('api.catalog.applications')),
  ]);
  if (!productRes.ok) throw new Error(`Product API failed: ${productRes.status}`);
  if (!appsRes.ok) throw new Error(`Applications API failed: ${appsRes.status}`);
  return Promise.all([productRes.json(), appsRes.json()]);
}

function buildGallery(primaries, thumbnails) {
  const gallery = document.createElement('div');
  gallery.className = 'pd-gallery';

  const thumbMap = Object.fromEntries(thumbnails.map((t) => [t.index, resolveImageUrl(t.url)]));
  const pairs = primaries
    .map((p) => ({
      mainUrl: resolveImageUrl(p.url),
      thumbUrl: thumbMap[p.index] || resolveImageUrl(p.url),
    }))
    .filter((p) => p.mainUrl);

  pairs.slice(1).forEach(({ mainUrl }) => {
    const preloadImg = new Image();
    preloadImg.decoding = 'async';
    preloadImg.src = mainUrl;
  });

  const mainImg = document.createElement('img');
  mainImg.className = 'pd-main-image';
  mainImg.alt = '';
  mainImg.decoding = 'async';
  if (pairs[0]) mainImg.src = pairs[0].mainUrl;

  let currentIndex = 0;

  const thumbEls = [];

  function activate(index) {
    if (!pairs.length) return;
    currentIndex = (index + pairs.length) % pairs.length;
    mainImg.src = pairs[currentIndex].mainUrl;
    thumbEls.forEach((t, i) => {
      const isActive = i === currentIndex;
      t.classList.toggle('pd-thumbnail-active', isActive);
      t.setAttribute('aria-current', isActive ? 'true' : 'false');
      t.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function showPrevious() {
    activate(currentIndex - 1);
  }

  function showNext() {
    activate(currentIndex + 1);
  }

  if (pairs.length > 1) {
    mainImg.tabIndex = 0;
    mainImg.setAttribute('role', 'button');
    mainImg.setAttribute('aria-label', 'Show next product image');
  }

  const navEl = document.createElement('div');
  navEl.className = 'pd-gallery-nav';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'pd-gallery-arrow';
  prevBtn.setAttribute('aria-label', 'Previous image');
  prevBtn.textContent = '◄';
  prevBtn.disabled = pairs.length <= 1;
  prevBtn.dataset.galleryAction = 'previous';

  const thumbsEl = document.createElement('div');
  thumbsEl.className = 'pd-thumbnails';

  pairs.forEach(({ thumbUrl }, i) => {
    const thumb = document.createElement('img');
    thumb.src = thumbUrl;
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.className = 'pd-thumbnail';
    thumb.tabIndex = 0;
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('aria-label', `Show product image ${i + 1}`);
    thumb.setAttribute('aria-current', i === 0 ? 'true' : 'false');
    thumb.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    thumb.dataset.galleryIndex = String(i);
    if (i === 0) thumb.classList.add('pd-thumbnail-active');
    thumbEls.push(thumb);
    thumbsEl.appendChild(thumb);
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'pd-gallery-arrow';
  nextBtn.setAttribute('aria-label', 'Next image');
  nextBtn.textContent = '►';
  nextBtn.disabled = pairs.length <= 1;
  nextBtn.dataset.galleryAction = 'next';

  gallery.addEventListener('click', (e) => {
    const arrow = e.target.closest('.pd-gallery-arrow');
    if (arrow && gallery.contains(arrow)) {
      if (arrow.dataset.galleryAction === 'previous') showPrevious();
      if (arrow.dataset.galleryAction === 'next') showNext();
      return;
    }

    const thumb = e.target.closest('.pd-thumbnail');
    if (thumb && gallery.contains(thumb)) {
      activate(Number(thumb.dataset.galleryIndex));
      return;
    }

    if (e.target.closest('.pd-main-image')) showNext();
  });

  gallery.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPrevious();
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      showNext();
      return;
    }

    if (e.key !== 'Enter' && e.key !== ' ') return;

    const thumb = e.target.closest('.pd-thumbnail');
    if (thumb && gallery.contains(thumb)) {
      e.preventDefault();
      activate(Number(thumb.dataset.galleryIndex));
      return;
    }

    if (e.target.closest('.pd-main-image')) {
      e.preventDefault();
      showNext();
    }
  });

  navEl.append(prevBtn, thumbsEl, nextBtn);
  gallery.append(mainImg, navEl);
  return gallery;
}

function buildInfo(product) {
  const info = document.createElement('div');
  info.className = 'pd-info';

  const brandEl = document.createElement('p');
  brandEl.className = 'pd-brand-name';
  brandEl.textContent = product.brand_name || '';

  const nameEl = document.createElement('h1');
  nameEl.className = 'pd-part-name';
  const titleDesc = findDesc(product.descriptions, 'TLE');
  nameEl.textContent = titleDesc?.contents?.[0]?.content || product.part_type || product.title || '';

  const numberEl = document.createElement('p');
  numberEl.className = 'pd-part-number';
  numberEl.innerHTML = `Part Number: <strong>${product.part_number}</strong>`;

  const mktDesc = findDesc(product.descriptions, 'MKT');
  const descText = mktDesc?.contents?.[0]?.content || '';
  const descEl = document.createElement('p');
  descEl.className = 'pd-description';
  descEl.textContent = descText;

  const fabDesc = findDesc(product.descriptions, 'FAB');
  const featuresEl = document.createElement('ul');
  featuresEl.className = 'pd-features';
  (fabDesc?.contents || []).forEach(({ content }) => {
    const li = document.createElement('li');
    li.textContent = content;
    featuresEl.appendChild(li);
  });

  info.append(brandEl, nameEl, numberEl, descEl, featuresEl);
  return info;
}

function buildSpecsTable(attributes) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pd-specs-wrapper';
  const table = document.createElement('table');
  table.className = 'pd-specs-table';
  const tbody = document.createElement('tbody');
  (attributes || []).forEach((attr) => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = attr.attribute;
    const tdVal = document.createElement('td');
    tdVal.textContent = attr.attribute_uom
      ? `${attr.attribute_value} ${attr.attribute_uom}`
      : attr.attribute_value;
    tr.append(tdName, tdVal);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

const APP_COLUMNS = [
  { label: 'Make', get: (app) => app.make?.value || '' },
  { label: 'Model', get: (app) => app.model?.value || '' },
  {
    label: 'Year Range',
    get: (app) => {
      const y = app.years || [];
      return y.length ? `${Math.min(...y)}–${Math.max(...y)}` : '';
    },
  },
  { label: 'Description', get: (app) => app.category?.part_type_value || '' },
  { label: 'Position', get: (app) => app.position?.value || '' },
  { label: 'Drive Wheel', get: (app) => app.drive?.value || '' },
  { label: 'Veh. Qty.', get: (app) => app.qty ?? '' },
  { label: 'Engine Base', get: (app) => app.engine_base_value || '' },
  { label: 'Engine VIN', get: (app) => app.engine_version_value || '' },
];

function buildAppsTable(applicationGroupList) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pd-apps-wrapper';

  const groups = Object.entries(applicationGroupList || {});
  if (!groups.length) {
    const p = document.createElement('p');
    p.textContent = 'No application data available.';
    wrapper.appendChild(p);
    return wrapper;
  }

  groups.forEach(([groupName, groupData]) => {
    const groupTitle = document.createElement('h3');
    groupTitle.className = 'pd-apps-group-title';
    groupTitle.textContent = groupName;
    wrapper.appendChild(groupTitle);

    const table = document.createElement('table');
    table.className = 'pd-apps-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    APP_COLUMNS.forEach(({ label }) => {
      const th = document.createElement('th');
      th.textContent = label;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement('tbody');
    const apps = groupData?.applications || [];
    apps.forEach((app) => {
      const tr = document.createElement('tr');
      APP_COLUMNS.forEach(({ get }) => {
        const td = document.createElement('td');
        td.textContent = get(app);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    wrapper.appendChild(table);
  });

  return wrapper;
}

function buildOtherMedia(documents) {
  const wrapper = document.createElement('div');
  wrapper.className = 'pd-media-wrapper';
  if (!documents.length) return wrapper;

  const heading = document.createElement('h3');
  heading.className = 'pd-media-section-title';
  heading.textContent = 'Documents';
  wrapper.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'pd-media-list';
  documents.forEach((doc) => {
    const card = document.createElement('a');
    card.className = 'pd-media-card';
    card.href = doc.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    const titleEl = document.createElement('span');
    titleEl.className = 'pd-media-card-title';
    titleEl.textContent = doc.title;
    const langEl = document.createElement('span');
    langEl.className = 'pd-media-card-lang';
    langEl.textContent = `Language: ${doc.language}`;
    card.append(titleEl, langEl);
    list.appendChild(card);
  });
  wrapper.appendChild(list);
  return wrapper;
}

function buildTabs(specsPanel, appsPanel, mediaPanel) {
  const tabs = document.createElement('div');
  tabs.className = 'pd-tabs';

  const nav = document.createElement('div');
  nav.className = 'pd-tab-nav';

  const allPanels = [
    { id: 'specs', label: 'Specifications', panel: specsPanel },
    { id: 'apps', label: 'Applications', panel: appsPanel },
    { id: 'media', label: 'Other Media', panel: mediaPanel },
  ].filter(({ panel }) => panel.children.length > 0 || panel === specsPanel || panel === appsPanel);

  allPanels.forEach(({ id, label, panel }, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pd-tab-btn';
    btn.dataset.tab = id;
    btn.textContent = label;
    panel.classList.add('pd-tab-panel');
    panel.dataset.tab = id;
    if (i !== 0) panel.hidden = true;
    else btn.classList.add('pd-tab-btn-active');

    btn.addEventListener('click', () => {
      nav.querySelectorAll('.pd-tab-btn').forEach((b) => b.classList.remove('pd-tab-btn-active'));
      tabs.querySelectorAll('.pd-tab-panel').forEach((p) => { p.hidden = true; });
      btn.classList.add('pd-tab-btn-active');
      panel.hidden = false;
    });

    nav.appendChild(btn);
  });

  tabs.append(nav, ...allPanels.map((p) => p.panel));
  return tabs;
}

export default async function decorate(block) {
  const sp = new URLSearchParams(window.location.search);
  const partNumber = sp.get('part_number');
  const brandCode = sp.get('brand_code');
  const partName = sp.get('part_name') || '';

  const layout = document.createElement('div');
  layout.className = 'pd-layout';

  const loadingEl = document.createElement('div');
  loadingEl.className = 'pd-loading';
  loadingEl.setAttribute('aria-live', 'polite');
  const spinner = document.createElement('span');
  spinner.className = 'pd-spinner';
  spinner.setAttribute('aria-hidden', 'true');
  const loadingText = document.createElement('span');
  loadingText.textContent = 'Loading part details…';
  loadingEl.append(spinner, loadingText);

  const errorEl = document.createElement('div');
  errorEl.className = 'pd-error';
  errorEl.hidden = true;
  const errorMsg = document.createElement('p');
  errorMsg.className = 'pd-error-message';
  const retryBtn = document.createElement('button');
  retryBtn.className = 'pd-retry-btn';
  retryBtn.textContent = 'Try Again';
  errorEl.append(errorMsg, retryBtn);

  const backBtn = document.createElement('a');
  backBtn.className = 'pd-back-btn';
  backBtn.href = '/find-my-part';
  backBtn.textContent = '← Back To Results';
  backBtn.addEventListener('click', (e) => {
    if (window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
  });

  block.innerHTML = '';
  block.append(backBtn, loadingEl, errorEl, layout);

  if (!partNumber || !brandCode) {
    loadingEl.hidden = true;
    errorMsg.textContent = `Missing part number or brand code${partName ? ` for "${partName}"` : ''}.`;
    errorEl.hidden = false;
    return;
  }

  async function load() {
    loadingEl.hidden = false;
    errorEl.hidden = true;
    layout.innerHTML = '';

    try {
      const [product, appsData] = await fetchPartDetails(partNumber, brandCode);

      loadingEl.hidden = true;

      const primaries = product.dam_assets?.productPrimaries || [];
      const thumbnails = product.dam_assets?.productThumbnails || [];
      const documents = product.dam_assets?.productDocuments || [];
      const gallery = buildGallery(primaries, thumbnails);
      const info = buildInfo(product);
      const specsPanel = buildSpecsTable(product.part_attributes);
      const appsPanel = buildAppsTable(appsData.application_group_list);
      const mediaPanel = buildOtherMedia(documents);
      const tabs = buildTabs(specsPanel, appsPanel, mediaPanel);

      layout.append(gallery, info, tabs);
    } catch {
      loadingEl.hidden = true;
      errorMsg.textContent = 'Failed to load part details. Please try again.';
      errorEl.hidden = false;
    }
  }

  retryBtn.addEventListener('click', load);
  load();
}
