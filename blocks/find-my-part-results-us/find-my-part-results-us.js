const API_BASE = 'https://www.moogparts.com/driv/partfinder';
const MOOG_ASSET_BASE = 'https://www.moogparts.com';
const API_PARAMS = { brand: 'moog', locale: 'en_US', country_code: 'US' };
const APPLICATION_TYPES = [
  { label: 'Light Duty', vehicleGroupId: '2' },
  { label: 'Medium Duty / Heavy Truck', vehicleGroupId: '8' },
];

function resolveImageUrl(url) {
  if (!url) return null;
  return url.startsWith('/') ? `${MOOG_ASSET_BASE}${url}` : url;
}

function getVehicleGroupLabel(vehicleGroupId) {
  const type = APPLICATION_TYPES.find((t) => t.vehicleGroupId === String(vehicleGroupId));
  return type ? type.label : '';
}

function buildPartDetailsUrl(redirectUrl) {
  if (!redirectUrl) return null;
  try {
    const src = new URL(redirectUrl.replace(/&amp;/g, '&'));
    const params = new URLSearchParams({
      brand_code: src.searchParams.get('brand_code') || '',
      part_number: src.searchParams.get('part_number') || '',
      part_name: src.searchParams.get('part_name') || '',
    });
    return `/part-details?${params.toString()}`;
  } catch {
    return null;
  }
}

function buildListRow(app, yearLabel, makeLabel, modelLabel) {
  const li = document.createElement('li');
  li.className = 'fmpr-row';

  const imageDiv = document.createElement('div');
  imageDiv.className = 'fmpr-row-image';
  const primaryImages = app.dam_assets?.productPrimaries;
  const imageUrl = resolveImageUrl(primaryImages?.[0]?.url);
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = app.part_name;
    img.loading = 'lazy';
    imageDiv.appendChild(img);
  } else {
    imageDiv.classList.add('fmpr-row-image-placeholder');
  }

  const body = document.createElement('div');
  body.className = 'fmpr-row-body';

  const partNumberEl = document.createElement('p');
  partNumberEl.className = 'fmpr-row-part-number';
  const partHref = buildPartDetailsUrl(app.part_detail_redirect_url) || '#';
  partNumberEl.innerHTML = `Part No: <a href="${partHref}">${app.part_number}</a>`;

  const partNameEl = document.createElement('p');
  partNameEl.className = 'fmpr-row-part-name';
  partNameEl.innerHTML = `<a href="${partHref}">${app.part_name}</a>`;

  const featuresWrapper = document.createElement('div');
  featuresWrapper.className = 'fmpr-row-features';

  const toggleList = document.createElement('ul');
  toggleList.className = 'fmpr-row-features-toggle-list';
  const toggleItem = document.createElement('li');
  toggleItem.className = 'fmpr-row-features-toggle';
  toggleItem.textContent = 'Features';
  toggleList.appendChild(toggleItem);

  const featuresBody = document.createElement('div');
  featuresBody.className = 'fmpr-row-features-body';

  const product = document.createElement('p');
  product.textContent = `Product: ${app.part_name}`;

  const position = document.createElement('p');
  position.textContent = `Position: ${app.position?.value || ''}`;

  const appQty = document.createElement('p');
  appQty.textContent = `Application Qty: ${app.quantity_per_application ?? app.qty ?? ''}`;

  const fits = document.createElement('p');
  fits.className = 'fmpr-row-fits';
  const fitsCheck = document.createElement('span');
  fitsCheck.className = 'fmpr-row-fits-icon';
  fitsCheck.setAttribute('aria-hidden', 'true');
  const fitsLabel = document.createElement('span');
  fitsLabel.textContent = `${yearLabel}, ${makeLabel}, ${modelLabel}`.toUpperCase();
  fits.append('Fits: ', fitsCheck, fitsLabel);

  featuresBody.append(product, position, appQty, fits);

  toggleItem.addEventListener('click', () => {
    featuresBody.hidden = !featuresBody.hidden;
  });

  featuresWrapper.append(toggleList, featuresBody);
  body.append(partNumberEl, partNameEl, featuresWrapper);
  li.append(imageDiv, body);
  return li;
}

function getFilteredApps(applications, filterState) {
  return applications.filter((app) => {
    const catMatch = filterState.categories.size === 0
      || filterState.categories.has(app.category.category_value);
    const ptMatch = filterState.partTypes.size === 0
      || filterState.partTypes.has(app.category.part_type_value);
    return catMatch && ptMatch;
  });
}

function buildResultsList(applications, filterState, vehicle, countEl, listEl) {
  const filtered = getFilteredApps(applications, filterState);
  const count = filtered.length;
  countEl.textContent = `${count} Part Result${count !== 1 ? 's' : ''}`;
  listEl.innerHTML = '';
  filtered.forEach((app) => {
    listEl.appendChild(buildListRow(app, vehicle.year, vehicle.make, vehicle.model));
  });
}

function buildFacetPanel(data, filterState, onFilterChange) {
  const aside = document.createElement('aside');
  aside.className = 'fmpr-facets';

  const header = document.createElement('div');
  header.className = 'fmpr-facets-header';
  const headerLabel = document.createElement('p');
  headerLabel.className = 'fmpr-facets-label';
  headerLabel.textContent = 'Filter Results';
  const clearBtn = document.createElement('button');
  clearBtn.className = 'fmpr-clear-filters';
  clearBtn.textContent = 'Clear Filters';
  header.append(headerLabel, clearBtn);

  const categories = data.category_tree?.categories || [];
  const partTypeSet = new Set();
  categories.forEach((cat) => {
    cat.sub_categories?.forEach((sub) => {
      sub.part_types?.forEach((pt) => partTypeSet.add(pt.value));
    });
  });

  function buildAccordion(label, items, stateSet) {
    const group = document.createElement('div');
    group.className = 'fmpr-facet-group';

    const toggle = document.createElement('button');
    toggle.className = 'fmpr-facet-toggle';
    toggle.type = 'button';
    const toggleText = document.createElement('span');
    toggleText.textContent = label;
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'fmpr-facet-icon';
    toggleIcon.textContent = '+';
    toggle.append(toggleText, toggleIcon);

    const list = document.createElement('ul');
    list.className = 'fmpr-facet-list';
    list.hidden = true;

    items.forEach((value) => {
      const item = document.createElement('li');
      item.className = 'fmpr-facet-item';
      const itemLabel = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = value;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          stateSet.add(value);
        } else {
          stateSet.delete(value);
        }
        onFilterChange();
      });
      itemLabel.append(checkbox, document.createTextNode(` ${value}`));
      item.appendChild(itemLabel);
      list.appendChild(item);
    });

    toggle.addEventListener('click', () => {
      const isHidden = list.hidden;
      list.hidden = !isHidden;
      toggleIcon.textContent = isHidden ? '−' : '+';
    });

    group.append(toggle, list);
    return group;
  }

  const catAccordion = buildAccordion(
    'Product Category',
    categories.map((c) => c.value),
    filterState.categories,
  );
  const ptAccordion = buildAccordion(
    'Part Types / Positions',
    [...partTypeSet],
    filterState.partTypes,
  );

  clearBtn.addEventListener('click', () => {
    filterState.categories.clear();
    filterState.partTypes.clear();
    aside.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
    onFilterChange();
  });

  aside.append(header, catAccordion, ptAccordion);
  return aside;
}

async function fetchPartsList(params) {
  const url = new URL(`${API_BASE}/api.catalog.partslist`);
  Object.entries({ ...API_PARAMS, no_cache: Date.now(), ...params })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Parts list API failed: ${res.status}`);
  return res.json();
}

function parseConfig(block) {
  return {
    whereToBuyUrl: block.querySelector(':scope > div a')?.href || null,
  };
}

export default async function decorate(block) {
  parseConfig(block);
  const sp = new URLSearchParams(window.location.search);
  const yearId = sp.get('yearId');
  const makeId = sp.get('makeId');
  const modelId = sp.get('modelId');
  const vehicleGroupId = sp.get('vehicleGroupId') || '2';
  const yearLabel = sp.get('yearLabel') || yearId || '';
  const makeLabel = sp.get('makeLabel') || makeId || '';
  const modelLabel = sp.get('modelLabel') || modelId || '';

  const vehicleHeader = document.createElement('div');
  vehicleHeader.className = 'fmpr-vehicle-header';
  const titleEl = document.createElement('h1');
  titleEl.className = 'fmpr-vehicle-title';
  titleEl.textContent = `${yearLabel} ${makeLabel} ${modelLabel}`.trim().toUpperCase();
  const metaEl = document.createElement('p');
  metaEl.className = 'fmpr-vehicle-meta';
  metaEl.textContent = getVehicleGroupLabel(vehicleGroupId);
  vehicleHeader.append(titleEl, metaEl);

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'fmpr-content-wrapper';

  const mainEl = document.createElement('div');
  mainEl.className = 'fmpr-main';

  const loadingEl = document.createElement('div');
  loadingEl.className = 'fmpr-loading';
  loadingEl.setAttribute('aria-live', 'polite');
  const spinner = document.createElement('span');
  spinner.className = 'fmpr-spinner';
  spinner.setAttribute('aria-hidden', 'true');
  const loadingText = document.createElement('span');
  loadingText.className = 'fmpr-loading-text';
  loadingText.textContent = 'Loading parts…';
  loadingEl.append(spinner, loadingText);

  const errorEl = document.createElement('div');
  errorEl.className = 'fmpr-error';
  errorEl.hidden = true;
  const errorMsg = document.createElement('p');
  errorMsg.className = 'fmpr-error-message';
  errorEl.appendChild(errorMsg);

  const emptyEl = document.createElement('div');
  emptyEl.className = 'fmpr-empty';
  emptyEl.hidden = true;
  const emptyMsg = document.createElement('p');
  emptyMsg.className = 'fmpr-empty-message';
  emptyMsg.textContent = 'No parts found for this vehicle.';
  emptyEl.appendChild(emptyMsg);

  const resultsEl = document.createElement('div');
  resultsEl.className = 'fmpr-results';
  resultsEl.hidden = true;

  mainEl.append(loadingEl, errorEl, emptyEl, resultsEl);
  contentWrapper.appendChild(mainEl);

  block.innerHTML = '';
  block.append(vehicleHeader, contentWrapper);

  if (!yearId || !makeId || !modelId) {
    loadingEl.hidden = true;
    errorMsg.textContent = 'Invalid search parameters.';
    errorEl.hidden = false;
    return;
  }

  const retryBtn = document.createElement('button');
  retryBtn.className = 'fmpr-retry-btn';
  retryBtn.textContent = 'Try Again';
  errorEl.appendChild(retryBtn);

  const filterState = { categories: new Set(), partTypes: new Set() };

  async function loadResults() {
    loadingEl.hidden = false;
    errorEl.hidden = true;
    emptyEl.hidden = true;
    resultsEl.hidden = true;
    resultsEl.innerHTML = '';

    try {
      const data = await fetchPartsList({
        year_id: yearId,
        make_id: makeId,
        model_id: modelId,
        vehicle_group_ids: vehicleGroupId,
      });

      loadingEl.hidden = true;
      const applications = data.application_list?.applications || [];

      if (!applications.length) {
        emptyEl.hidden = false;
        return;
      }

      const countEl = document.createElement('h4');
      countEl.className = 'fmpr-results-count';

      const listEl = document.createElement('ul');
      listEl.className = 'fmpr-list';

      const vehicle = { year: yearLabel, make: makeLabel, model: modelLabel };
      buildResultsList(applications, filterState, vehicle, countEl, listEl);

      resultsEl.append(countEl, listEl);
      resultsEl.hidden = false;

      const facetPanel = buildFacetPanel(data, filterState, () => {
        buildResultsList(applications, filterState, vehicle, countEl, listEl);
      });

      contentWrapper.insertBefore(facetPanel, mainEl);
    } catch {
      loadingEl.hidden = true;
      errorMsg.textContent = 'Failed to load parts. Please try again.';
      errorEl.hidden = false;
    }
  }

  retryBtn.addEventListener('click', loadResults);
  loadResults();
}
