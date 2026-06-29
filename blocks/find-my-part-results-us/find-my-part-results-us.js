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

function buildApplicationMap(applications) {
  const map = new Map();
  applications.forEach((app) => {
    const { category_value: cat, sub_category_value: sub, part_type_value: pt } = app.category;
    if (!map.has(cat)) map.set(cat, new Map());
    const subMap = map.get(cat);
    if (!subMap.has(sub)) subMap.set(sub, new Map());
    const ptMap = subMap.get(sub);
    if (!ptMap.has(pt)) ptMap.set(pt, []);
    ptMap.get(pt).push(app);
  });
  return map;
}

function buildCard(app, whereToBuyUrl) {
  const li = document.createElement('li');
  li.className = 'fmpr-card';

  const imageDiv = document.createElement('div');
  imageDiv.className = 'fmpr-card-image';
  const primaryImages = app.dam_assets?.productPrimaries;
  const imageUrl = resolveImageUrl(primaryImages?.[0]?.url);
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = app.part_name;
    img.loading = 'lazy';
    imageDiv.appendChild(img);
  } else {
    imageDiv.classList.add('fmpr-card-image-placeholder');
  }

  const body = document.createElement('div');
  body.className = 'fmpr-card-body';

  const partNumber = document.createElement('p');
  partNumber.className = 'fmpr-card-part-number';
  partNumber.textContent = app.part_number;

  const partName = document.createElement('p');
  partName.className = 'fmpr-card-part-name';
  partName.textContent = app.part_name;

  const position = document.createElement('p');
  position.className = 'fmpr-card-position';
  position.textContent = app.position?.value || '';

  const brand = document.createElement('p');
  brand.className = 'fmpr-card-brand';
  brand.textContent = app.brand_name;

  const ctaHref = whereToBuyUrl || app.part_detail_redirect_url?.replace(/&amp;/g, '&') || '#';
  const cta = document.createElement('a');
  cta.className = 'fmpr-card-cta';
  cta.href = ctaHref;
  cta.target = '_blank';
  cta.rel = 'noopener noreferrer';
  cta.textContent = 'View Details »»';

  body.append(partNumber, partName, position, brand, cta);
  li.append(imageDiv, body);
  return li;
}

function buildResultsTree(data, whereToBuyUrl) {
  const appMap = buildApplicationMap(data.application_list.applications);
  const totalCount = data.application_list.total_count;
  const fragment = document.createDocumentFragment();

  const countEl = document.createElement('p');
  countEl.className = 'fmpr-results-count';
  countEl.textContent = `${totalCount} part${totalCount !== 1 ? 's' : ''} found`;
  fragment.appendChild(countEl);

  data.category_tree.categories.forEach((cat) => {
    const section = document.createElement('section');
    section.className = 'fmpr-category';

    const catHeading = document.createElement('h2');
    catHeading.className = 'fmpr-category-heading';
    catHeading.textContent = cat.value.toUpperCase();
    section.appendChild(catHeading);

    cat.sub_categories.forEach((sub) => {
      const subDiv = document.createElement('div');
      subDiv.className = 'fmpr-subcategory';

      const subHeading = document.createElement('h3');
      subHeading.className = 'fmpr-subcategory-heading';
      subHeading.textContent = sub.value;
      subDiv.appendChild(subHeading);

      sub.part_types.forEach((pt) => {
        const ptDiv = document.createElement('div');
        ptDiv.className = 'fmpr-part-type';

        const ptHeading = document.createElement('h4');
        ptHeading.className = 'fmpr-part-type-heading';
        ptHeading.textContent = pt.value;
        ptDiv.appendChild(ptHeading);

        const apps = appMap.get(cat.value)?.get(sub.value)?.get(pt.value) || [];
        if (apps.length) {
          const ul = document.createElement('ul');
          ul.className = 'fmpr-card-list';
          apps.forEach((app) => ul.appendChild(buildCard(app, whereToBuyUrl)));
          ptDiv.appendChild(ul);
        }

        subDiv.appendChild(ptDiv);
      });

      section.appendChild(subDiv);
    });

    fragment.appendChild(section);
  });

  return fragment;
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
  const { whereToBuyUrl } = parseConfig(block);
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

  block.innerHTML = '';
  block.append(vehicleHeader, loadingEl, errorEl, emptyEl, resultsEl);

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
      if (!data.application_list?.applications?.length) {
        emptyEl.hidden = false;
      } else {
        resultsEl.appendChild(buildResultsTree(data, whereToBuyUrl));
        resultsEl.hidden = false;
      }
    } catch {
      loadingEl.hidden = true;
      errorMsg.textContent = 'Failed to load parts. Please try again.';
      errorEl.hidden = false;
    }
  }

  retryBtn.addEventListener('click', loadResults);
  loadResults();
}
