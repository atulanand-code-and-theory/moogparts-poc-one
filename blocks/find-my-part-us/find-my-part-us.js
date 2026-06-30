// Update to your deployed Cloudflare Worker URL after running: npx wrangler deploy
const WORKER_BASE = 'https://moogparts-catalog-api.atul-code-auth0.workers.dev';
const API_BASE = `${WORKER_BASE}/catalog`;
const API_PARAMS = { brand: 'moog', locale: 'en_US', country_code: 'US' };
const APPLICATION_TYPES = [
  { label: 'Light Duty', vehicleGroupId: 2 },
  { label: 'Medium Duty / Heavy Truck', vehicleGroupId: 8 },
];

async function fetchCatalog(endpoint, extra) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries({ ...API_PARAMS, ...extra }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${endpoint} failed: ${res.status}`);
  return res.json();
}

function getSelectGroup(select) {
  return select.closest('.find-my-part-us-select-group');
}

function getOptions(group) {
  return [...group.querySelectorAll('[role="option"]:not([hidden])')];
}

function getAllOptions(group) {
  return [...group.querySelectorAll('[role="option"]')];
}

function getActiveOption(group) {
  return group.querySelector('[role="option"].is-active');
}

function setActiveOption(group, target, focusOption = true) {
  const options = getOptions(group);
  if (!options.length) return;

  const currentOption = getActiveOption(group);
  let nextIndex = options.indexOf(currentOption);

  if (target === 'first') nextIndex = 0;
  else if (target === 'last') nextIndex = options.length - 1;
  else if (Number.isInteger(target)) nextIndex = target;

  nextIndex = Math.max(0, Math.min(nextIndex, options.length - 1));

  options.forEach((option, index) => {
    const active = index === nextIndex;
    option.classList.toggle('is-active', active);
    option.tabIndex = active ? 0 : -1;
  });

  if (focusOption) options[nextIndex].focus();
}

function moveActiveOption(group, direction) {
  const options = getOptions(group);
  if (!options.length) return;

  const currentIndex = options.indexOf(getActiveOption(group));
  const nextIndex = currentIndex < 0 ? 0 : currentIndex + direction;
  setActiveOption(group, nextIndex);
}

function filterSelectOptions(group, query, focusOption = false) {
  const options = getAllOptions(group);
  const noResults = group.querySelector('.find-my-part-us-no-results');
  const normalizedQuery = query.trim().toLowerCase();
  let visibleCount = 0;

  options.forEach((option) => {
    const matches = option.textContent.toLowerCase().includes(normalizedQuery);
    option.hidden = !matches;
    option.classList.remove('is-active');
    option.tabIndex = -1;
    if (matches) visibleCount += 1;
  });

  noResults.hidden = visibleCount > 0;
  if (visibleCount > 0) setActiveOption(group, 'first', focusOption);
}

function closeSelectGroup(group) {
  const select = group.querySelector('select');
  const input = group.querySelector('.find-my-part-us-select-input');
  const list = group.querySelector('.find-my-part-us-options');
  const selectedOption = select.options[select.selectedIndex];
  input.value = select.value && selectedOption ? selectedOption.textContent : '';
  filterSelectOptions(group, '');
  group.classList.remove('is-open');
  input.setAttribute('aria-expanded', 'false');
  list.hidden = true;
}

function closeOtherSelectGroups(group) {
  document.querySelectorAll('.find-my-part-us-select-group.is-open').forEach((openGroup) => {
    if (openGroup !== group) closeSelectGroup(openGroup);
  });
}

function openSelectGroup(group, activeTarget = 'selected', focusOption = true) {
  const select = group.querySelector('select');
  const input = group.querySelector('.find-my-part-us-select-input');
  const list = group.querySelector('.find-my-part-us-options');
  filterSelectOptions(group, '');
  const options = getOptions(group);
  if (select.disabled || !options.length) return;

  closeOtherSelectGroups(group);
  group.classList.add('is-open');
  input.setAttribute('aria-expanded', 'true');
  list.hidden = false;

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.dataset.value === select.value),
  );
  setActiveOption(group, activeTarget === 'selected' ? selectedIndex : activeTarget, focusOption);
}

function toggleSelectGroup(group) {
  if (group.classList.contains('is-open')) closeSelectGroup(group);
  else openSelectGroup(group);
}

function syncCustomSelect(select) {
  const group = getSelectGroup(select);
  const input = group.querySelector('.find-my-part-us-select-input');
  const button = group.querySelector('.find-my-part-us-chevron');
  const list = group.querySelector('.find-my-part-us-options');
  const noResults = group.querySelector('.find-my-part-us-no-results');
  const selectedOption = select.options[select.selectedIndex];
  const { placeholder } = group.dataset;

  input.disabled = select.disabled;
  input.placeholder = placeholder;
  input.value = select.value && selectedOption ? selectedOption.textContent : '';
  button.disabled = select.disabled;
  list.innerHTML = '';

  [...select.options].slice(1).forEach((option) => {
    const item = document.createElement('li');
    item.className = 'find-my-part-us-option';
    item.dataset.value = option.value;
    item.id = `${select.id}-option-${option.value}`;
    item.setAttribute('role', 'option');
    item.tabIndex = -1;
    item.textContent = option.textContent;
    item.setAttribute('aria-selected', String(option.value === select.value));
    list.appendChild(item);
  });
  list.appendChild(noResults);
  filterSelectOptions(group, '');

  if (select.disabled) closeSelectGroup(group);
}

function chooseCustomOption(select, optionValue) {
  if (!optionValue || select.disabled) return;

  const group = getSelectGroup(select);
  select.value = optionValue;
  syncCustomSelect(select);
  closeSelectGroup(group);
  group.querySelector('.find-my-part-us-select-input').focus();
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function buildSelectGroup(id, placeholder) {
  const group = document.createElement('div');
  group.className = 'find-my-part-us-select-group';
  group.dataset.placeholder = placeholder;

  const select = document.createElement('select');
  select.id = id;
  select.setAttribute('aria-label', placeholder);
  select.setAttribute('aria-hidden', 'true');
  select.className = 'find-my-part-us-native-select';
  select.disabled = true;
  select.tabIndex = -1;

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = placeholder;
  select.appendChild(defaultOption);

  const trigger = document.createElement('div');
  trigger.className = 'find-my-part-us-select-trigger';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'find-my-part-us-select-input';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', `${id}-listbox`);
  input.setAttribute('aria-haspopup', 'listbox');
  input.setAttribute('aria-label', placeholder);
  input.autocomplete = 'off';
  input.placeholder = placeholder;
  input.disabled = true;

  const chevron = document.createElement('button');
  chevron.type = 'button';
  chevron.className = 'find-my-part-us-chevron';
  chevron.setAttribute('aria-label', `Open ${placeholder} options`);
  chevron.disabled = true;

  trigger.appendChild(input);
  trigger.appendChild(chevron);

  const list = document.createElement('ul');
  list.id = `${id}-listbox`;
  list.className = 'find-my-part-us-options';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', placeholder);
  list.hidden = true;

  const noResults = document.createElement('li');
  noResults.className = 'find-my-part-us-no-results';
  noResults.textContent = 'No matching options';
  noResults.hidden = true;
  list.appendChild(noResults);

  group.appendChild(select);
  group.appendChild(trigger);
  group.appendChild(list);

  input.addEventListener('focus', () => {
    if (select.disabled) return;
    openSelectGroup(group, 'selected', false);
  });

  input.addEventListener('input', () => {
    if (select.disabled) return;
    openSelectGroup(group, 'selected', false);
    filterSelectOptions(group, input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (select.disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (group.classList.contains('is-open')) {
        setActiveOption(group, e.key === 'ArrowUp' ? 'last' : 'first');
      } else {
        openSelectGroup(group, e.key === 'ArrowUp' ? 'last' : 'first');
      }
    } else if (e.key === 'Enter') {
      const activeOption = getActiveOption(group);
      if (activeOption) {
        e.preventDefault();
        chooseCustomOption(select, activeOption.dataset.value);
      }
    } else if (e.key === 'Escape') {
      closeSelectGroup(group);
    }
  });

  chevron.addEventListener('click', () => {
    if (select.disabled) return;
    input.focus();
    toggleSelectGroup(group);
  });

  list.addEventListener('click', (e) => {
    const option = e.target.closest('[role="option"]');
    if (!option || !list.contains(option)) return;
    chooseCustomOption(select, option.dataset.value);
  });

  list.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      moveActiveOption(group, e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActiveOption(group, e.key === 'Home' ? 'first' : 'last');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const activeOption = getActiveOption(group);
      if (activeOption) chooseCustomOption(select, activeOption.dataset.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSelectGroup(group);
      input.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!group.contains(e.target)) closeSelectGroup(group);
  });

  return group;
}

function populateSelect(select, items) {
  const [placeholder] = select.options;
  select.innerHTML = '';
  select.appendChild(placeholder);
  placeholder.selected = true;
  items.forEach(({ id, value }) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = value;
    select.appendChild(option);
  });
  select.disabled = false;
  select.value = '';
  syncCustomSelect(select);
}

function resetSelect(select) {
  const [placeholder] = select.options;
  select.innerHTML = '';
  select.appendChild(placeholder);
  placeholder.selected = true;
  select.disabled = true;
  select.value = '';
  syncCustomSelect(select);
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
    const vehicleGroupId = appTypeSelect.value;
    const yearLabel = yearSelect.options[yearSelect.selectedIndex].textContent;
    const makeLabel = makeSelect.options[makeSelect.selectedIndex].textContent;
    const modelLabel = modelSelect.options[modelSelect.selectedIndex].textContent;
    const url = new URL(vehicleUrl, window.location.origin);
    url.searchParams.set('yearId', yearId);
    url.searchParams.set('makeId', makeId);
    url.searchParams.set('modelId', modelId);
    url.searchParams.set('vehicleGroupId', vehicleGroupId);
    url.searchParams.set('yearLabel', yearLabel);
    url.searchParams.set('makeLabel', makeLabel);
    url.searchParams.set('modelLabel', modelLabel);
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
