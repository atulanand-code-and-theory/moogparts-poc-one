const API_BASE = 'https://www.moogparts.com/driv/partfinder';
const API_PARAMS = { brand: 'moog', locale: 'en_US', country_code: 'US' };
const APPLICATION_TYPES = [
  { label: 'Light Duty', vehicleGroupId: 2 },
  { label: 'Medium Duty / Heavy Truck', vehicleGroupId: 8 },
];

async function fetchCatalog(endpoint, extra) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries({
    ...API_PARAMS, no_cache: Date.now(), ...extra,
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${endpoint} failed: ${res.status}`);
  return res.json();
}

function buildSelectGroup(id, placeholder) {
  const group = document.createElement('div');
  group.className = 'find-my-part-us-select-group';

  const select = document.createElement('select');
  select.id = id;
  select.setAttribute('aria-label', placeholder);
  select.disabled = true;

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = placeholder;
  select.appendChild(defaultOption);

  const chevron = document.createElement('span');
  chevron.className = 'find-my-part-us-chevron';
  chevron.setAttribute('aria-hidden', 'true');

  group.appendChild(select);
  group.appendChild(chevron);
  return group;
}

function populateSelect(select, items) {
  const placeholder = select.options[0];
  select.innerHTML = '';
  select.appendChild(placeholder);
  items.forEach(({ id, value }) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = value;
    select.appendChild(option);
  });
  select.disabled = false;
  select.value = '';
}

function resetSelect(select) {
  const placeholder = select.options[0];
  select.innerHTML = '';
  select.appendChild(placeholder);
  select.disabled = true;
  select.value = '';
}

function parseConfig(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const getText = (row) => row?.querySelector('p, h1, h2, h3, h4')?.textContent?.trim() || '';
  const getHref = (row) => row?.querySelector('a')?.href || '';

  return {
    heading: getText(rows[0]) || 'FIND MY PART',
    subtitle: getText(rows[1]) || 'Search for MOOG products by vehicle or by part number.',
    vehicleUrl: getHref(rows[2]) || '/parts',
    partUrl: getHref(rows[3]) || '/parts/search',
  };
}

export default async function decorate(block) {
  const {
    heading, subtitle, vehicleUrl, partUrl,
  } = parseConfig(block);

  block.innerHTML = `
    <div class="find-my-part-us-header">
      <h2>${heading}</h2>
      <p>${subtitle}</p>
    </div>
    <div class="find-my-part-us-body">
      <div class="find-my-part-us-vehicle">
        <h3>Search by Vehicle</h3>
        <form class="find-my-part-us-vehicle-form" novalidate></form>
      </div>
      <div class="find-my-part-us-divider" aria-hidden="true"></div>
      <div class="find-my-part-us-part-number">
        <h3>Search by Part Number</h3>
        <form class="find-my-part-us-part-form" novalidate>
          <div class="find-my-part-us-input-group">
            <input type="text" placeholder="PART NUMBER" aria-label="Part number" />
            <button type="submit">search &#187;&#187;</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const vehicleForm = block.querySelector('.find-my-part-us-vehicle-form');

  // Application type
  const appTypeGroup = buildSelectGroup('fmp-app-type', 'Application type');
  const appTypeSelect = appTypeGroup.querySelector('select');
  const appTypeItems = APPLICATION_TYPES.map((t) => ({ id: t.vehicleGroupId, value: t.label }));
  populateSelect(appTypeSelect, appTypeItems);
  vehicleForm.appendChild(appTypeGroup);

  // Year / Make / Model selects — hidden until cascade populates them
  const yearGroup = buildSelectGroup('fmp-year', 'Year');
  const makeGroup = buildSelectGroup('fmp-make', 'Make');
  const modelGroup = buildSelectGroup('fmp-model', 'Model');
  [yearGroup, makeGroup, modelGroup].forEach((g) => {
    g.hidden = true;
    vehicleForm.appendChild(g);
  });

  const findBtn = document.createElement('button');
  findBtn.type = 'submit';
  findBtn.className = 'find-my-part-us-find-btn';
  findBtn.textContent = 'Find My Part';
  findBtn.disabled = true;
  findBtn.hidden = true;
  vehicleForm.appendChild(findBtn);

  const yearSelect = yearGroup.querySelector('select');
  const makeSelect = makeGroup.querySelector('select');
  const modelSelect = modelGroup.querySelector('select');

  // Application type → fetch years
  appTypeSelect.addEventListener('change', async () => {
    const vehicleGroupId = appTypeSelect.value;
    resetSelect(makeSelect);
    resetSelect(modelSelect);
    makeGroup.hidden = true;
    modelGroup.hidden = true;
    findBtn.hidden = true;
    findBtn.disabled = true;
    try {
      const { years } = await fetchCatalog('api.catalog.years', { vehicle_group_ids: vehicleGroupId });
      populateSelect(yearSelect, years);
      yearGroup.hidden = false;
    } catch {
      yearGroup.hidden = true;
    }
  });

  // Year → fetch makes
  yearSelect.addEventListener('change', async () => {
    const vehicleGroupId = appTypeSelect.value;
    const yearId = yearSelect.value;
    resetSelect(modelSelect);
    modelGroup.hidden = true;
    findBtn.hidden = true;
    findBtn.disabled = true;
    try {
      const { makes } = await fetchCatalog('api.catalog.makes', { vehicle_group_ids: vehicleGroupId, year_id: yearId });
      populateSelect(makeSelect, makes);
      makeGroup.hidden = false;
    } catch {
      makeGroup.hidden = true;
    }
  });

  // Make → fetch models
  makeSelect.addEventListener('change', async () => {
    const vehicleGroupId = appTypeSelect.value;
    const yearId = yearSelect.value;
    const makeId = makeSelect.value;
    findBtn.hidden = true;
    findBtn.disabled = true;
    try {
      const { models } = await fetchCatalog('api.catalog.models', { vehicle_group_ids: vehicleGroupId, year_id: yearId, make_id: makeId });
      populateSelect(modelSelect, models);
      modelGroup.hidden = false;
    } catch {
      modelGroup.hidden = true;
    }
  });

  // Model → enable Find button
  modelSelect.addEventListener('change', () => {
    const enabled = !!modelSelect.value;
    findBtn.disabled = !enabled;
    findBtn.hidden = !enabled;
  });

  // Vehicle form submit
  vehicleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const yearId = yearSelect.value;
    const makeId = makeSelect.value;
    const modelId = modelSelect.value;
    if (!yearId || !makeId || !modelId) return;
    const url = new URL(vehicleUrl, window.location.origin);
    url.searchParams.set('yearId', yearId);
    url.searchParams.set('makeId', makeId);
    url.searchParams.set('modelId', modelId);
    window.location.href = url.toString();
  });

  // Part number form submit
  const partForm = block.querySelector('.find-my-part-us-part-form');
  partForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const partNumber = partForm.querySelector('input').value.trim();
    if (!partNumber) return;
    const url = new URL(partUrl, window.location.origin);
    url.searchParams.set('partNumber', partNumber);
    window.location.href = url.toString();
  });
}
