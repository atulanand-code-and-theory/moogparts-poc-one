const API_BASE = 'https://www.moogparts.com/driv/partfinder';
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
    no_cache: Date.now(),
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

function buildGallery(images) {
  const gallery = document.createElement('div');
  gallery.className = 'pd-gallery';

  const mainImg = document.createElement('img');
  mainImg.className = 'pd-main-image';
  mainImg.alt = '';
  const firstUrl = resolveImageUrl(images[0]?.url);
  if (firstUrl) mainImg.src = firstUrl;

  const thumbsEl = document.createElement('div');
  thumbsEl.className = 'pd-thumbnails';

  images.forEach((img, i) => {
    const url = resolveImageUrl(img.url);
    if (!url) return;
    const thumb = document.createElement('img');
    thumb.src = url;
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.className = 'pd-thumbnail';
    if (i === 0) thumb.classList.add('pd-thumbnail-active');
    thumb.addEventListener('click', () => {
      mainImg.src = url;
      mainImg.alt = thumb.alt;
      thumbsEl.querySelectorAll('.pd-thumbnail').forEach((t) => t.classList.remove('pd-thumbnail-active'));
      thumb.classList.add('pd-thumbnail-active');
    });
    thumbsEl.appendChild(thumb);
  });

  gallery.append(mainImg, thumbsEl);
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
    ['Years', 'Make', 'Model', 'Position', 'Qty'].forEach((col) => {
      const th = document.createElement('th');
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement('tbody');
    const apps = groupData?.applications || [];
    apps.forEach((app) => {
      const tr = document.createElement('tr');
      const years = app.years || [];
      const yearRange = years.length
        ? `${Math.min(...years)}–${Math.max(...years)}`
        : '';
      [yearRange, app.make?.value || '', app.model?.value || '', app.position?.value || '', app.qty ?? ''].forEach((val) => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    wrapper.appendChild(table);
  });

  return wrapper;
}

function buildTabs(specsPanel, appsPanel) {
  const tabs = document.createElement('div');
  tabs.className = 'pd-tabs';

  const nav = document.createElement('div');
  nav.className = 'pd-tab-nav';

  const panels = [
    { id: 'specs', label: 'Specifications', panel: specsPanel },
    { id: 'apps', label: 'Applications', panel: appsPanel },
  ];

  panels.forEach(({ id, label, panel }, i) => {
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

  tabs.append(nav, ...panels.map((p) => p.panel));
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

  block.innerHTML = '';
  block.append(loadingEl, errorEl, layout);

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

      const images = product.dam_assets?.productPrimaries || [];
      const gallery = buildGallery(images);
      const info = buildInfo(product);
      const specsPanel = buildSpecsTable(product.part_attributes);
      const appsPanel = buildAppsTable(appsData.application_group_list);
      const tabs = buildTabs(specsPanel, appsPanel);

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
