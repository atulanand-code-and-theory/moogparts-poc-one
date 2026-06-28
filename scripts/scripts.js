import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

const HOMEPAGE_MEDIA_FALLBACKS = {
  heroOverlay: [
    '/content/loc-na/loc-us/fmmp-moog/en_US/jcr:content/main-par/header_hero_1176964492'
      + '.img.jpg/1780687234401.jpg',
    '/content/loc-na/loc-us/fmmp-moog/en_US/jcr:content/main-par/responsivegrid_1035720358'
      + '/header_hero_copy.img.jpg/1780687234515.jpg',
  ],
  columnsSplit: [
    '/content/loc-na/loc-us/fmmp-moog/en_US/_jcr_content/main-par/responsivegrid_1471213028'
      + '/responsivegrid/image.img.jpg/problem-solver-bulletin-hero-1780687234662.jpg',
    '/content/loc-na/loc-us/fmmp-moog/en_US/_jcr_content/main-par/responsivegrid_1471213028'
      + '/responsivegrid_copy/image.img.jpg/Diagnostic-Center-Landing_Hero-1780687234733.jpg',
  ],
  cardsArticle: [
    '/content/dam/marketing/North-America/moog/partsmatter/Why_Does_My_Car_Pull_To_One_Side_4.jpg',
    '/content/dam/marketing/North-America/moog/partsmatter/Uneven-Tire-Tread-Up-Close.jpg',
    '/content/dam/marketing/North-America/moog/partsmatter/Car-On-Alignment-Machine-Hero.jpg',
  ],
  cardsCategory: [
    '/content/loc-na/loc-us/fmmp-moog/en_US/jcr:content/main-par/hover_tout_1311363996'
      + '.img.jpg/1780687234850.jpg',
    '/content/loc-na/loc-us/fmmp-moog/en_US/jcr:content/main-par/hover_tout_662349038'
      + '.img.jpg/1780687234890.jpg',
    '/content/loc-na/loc-us/fmmp-moog/en_US/jcr:content/main-par/hover_tout_458124775'
      + '.img.jpg/1780687234931.jpg',
    '/content/loc-na/loc-us/fmmp-moog/en_US/jcr:content/main-par/hover_tout'
      + '.img.jpg/1780687234972.jpg',
  ],
  yellow: [
    '/content/loc-na/loc-us/fmmp-moog/en_US/jcr:content/main-par/hero_copy.img.png/1780687235013.png',
  ],
};

function liveMoogAsset(path) {
  return new URL(path, 'https://www.moogparts.com').href;
}

function isBrokenImportedImage(img) {
  const src = img.getAttribute('src') || '';
  return src === 'about:error' || src.startsWith('about:');
}

function applyImageFallbacks(scope, selector, fallbacks) {
  const brokenImages = [...scope.querySelectorAll(selector)].filter(isBrokenImportedImage);
  brokenImages.forEach((img, index) => {
    const fallback = fallbacks[index];
    if (fallback) img.src = liveMoogAsset(fallback);
  });
}

/**
 * Repairs currently imported homepage media placeholders that DA serves as
 * `about:error`. The source URLs are the live MOOG homepage assets and should
 * be replaced by regenerated DA media URLs when content is refreshed.
 * @param {Element} main The main container element
 */
function repairHomepageMedia(main) {
  applyImageFallbacks(main, '.hero-overlay img', HOMEPAGE_MEDIA_FALLBACKS.heroOverlay);
  applyImageFallbacks(main, '.columns-split img', HOMEPAGE_MEDIA_FALLBACKS.columnsSplit);
  applyImageFallbacks(main, '.cards-article img', HOMEPAGE_MEDIA_FALLBACKS.cardsArticle);
  applyImageFallbacks(main, '.cards-category img', HOMEPAGE_MEDIA_FALLBACKS.cardsCategory);
  applyImageFallbacks(main, '.yellow img', HOMEPAGE_MEDIA_FALLBACKS.yellow);
}

function refreshSectionContainerClasses(section) {
  [...section.classList]
    .filter((className) => className.endsWith('-container'))
    .forEach((className) => section.classList.remove(className));

  section.querySelectorAll(':scope > div > div.block').forEach((block) => {
    const blockName = block.dataset.blockName || block.classList[0];
    if (blockName) section.classList.add(`${blockName}-container`);
  });
}

function removeEmptyImportedMediaWrappers(section) {
  section.querySelectorAll(':scope > .default-content-wrapper').forEach((wrapper) => {
    const images = [...wrapper.querySelectorAll('img')];
    const hasText = wrapper.textContent.trim().length > 0;
    const hasOnlyBrokenMedia = images.length > 0 && images.every(isBrokenImportedImage);
    if (!hasText && hasOnlyBrokenMedia) wrapper.remove();
  });
}

/**
 * Cleans section artifacts produced by the first homepage import:
 * - move the second hero out of the Find My Part band when its section break is missing
 * - drop empty sections
 * @param {Element} main The main container element
 */
function normalizeHomepageSections(main) {
  main.querySelectorAll(':scope > .section').forEach((section) => {
    const wrappers = [...section.children];
    const hasWidget = wrappers.some((wrapper) => wrapper.classList.contains('widget-wrapper'));
    const splitIndex = wrappers.findIndex((wrapper, index) => (
      index > 0 && wrapper.classList.contains('hero-overlay-wrapper')
    ));

    if (hasWidget && splitIndex > 0) {
      const newSection = document.createElement('div');
      newSection.className = 'section';
      newSection.dataset.sectionStatus = 'initialized';
      newSection.style.display = 'none';
      wrappers.slice(splitIndex).forEach((wrapper) => newSection.append(wrapper));
      section.after(newSection);
      refreshSectionContainerClasses(section);
      refreshSectionContainerClasses(newSection);
    } else {
      refreshSectionContainerClasses(section);
    }
    removeEmptyImportedMediaWrappers(section);
  });

  main.querySelectorAll(':scope > .section').forEach((section) => {
    if (!section.textContent.trim() && section.children.length === 0) section.remove();
  });
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  repairHomepageMedia(main);
  decorateSections(main);
  decorateBlocks(main);
  normalizeHomepageSections(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
