import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.5a3 3 0 0 0-2.12-2.12C19.5 3.86 12 3.86 12 3.86s-7.5 0-9.38.52A3 3 0 0 0 .5 6.5C0 8.38 0 12 0 12s0 3.62.5 5.5a3 3 0 0 0 2.12 2.12c1.88.52 9.38.52 9.38.52s7.5 0 9.38-.52a3 3 0 0 0 2.12-2.12C24 15.62 24 12 24 12s0-3.62-.5-5.5ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4Zm6.41-10.4a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44Z"/></svg>',
};

// The MOOG logo is stored as a committed asset so it renders independently of the
// content backend, which does not serve the nav's original image reference.
const NAV_LOGO_SRC = '/icons/moog-logo.png';

/**
 * Replaces the brand logo image (whose authored source does not resolve) with the
 * committed local asset.
 * @param {Element} navBrand The brand section element
 */
function repairBrandLogo(navBrand) {
  const picture = navBrand.querySelector('picture');
  const img = navBrand.querySelector('img');
  if (!img) return;

  const replacement = document.createElement('img');
  replacement.src = NAV_LOGO_SRC;
  replacement.alt = img.getAttribute('alt') || 'MOOG Logo';
  replacement.width = 824;
  replacement.height = 180;

  if (picture) {
    const newPicture = document.createElement('picture');
    newPicture.append(replacement);
    picture.replaceWith(newPicture);
  } else {
    img.replaceWith(replacement);
  }
}

function closeAllMegamenus(nav) {
  nav.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((d) => d.setAttribute('aria-expanded', 'false'));
}

function updatePageScrollLock(nav) {
  const mobileMenuOpen = !isDesktop.matches && nav.getAttribute('aria-expanded') === 'true';
  document.body.style.overflowY = mobileMenuOpen ? 'hidden' : '';
}

function closeLocale(nav) {
  const localeOpen = nav.querySelector('.nav-locale[aria-expanded="true"]');
  if (!localeOpen) return;
  localeOpen.setAttribute('aria-expanded', 'false');
  const trigger = localeOpen.querySelector('.nav-locale-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  updatePageScrollLock(nav);
}

/**
 * Collapse every open mobile accordion (top-level + nested) and reset chevrons.
 */
function collapseAllAccordions(nav) {
  nav.querySelectorAll('[aria-expanded="true"].nav-drop, .nav-accordion[aria-expanded="true"]').forEach((el) => {
    el.setAttribute('aria-expanded', 'false');
  });
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (!nav) return;
    closeAllMegamenus(nav);
    closeLocale(nav);
    if (!isDesktop.matches) {
      const navSections = nav.querySelector('.nav-sections');
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

/**
 * Toggles the entire nav (mobile hamburger)
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  updatePageScrollLock(nav);
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Build social icon links from text labels (Facebook/YouTube/Instagram).
 * Reads link text from the nav DOM; never hardcodes destinations.
 */
function decorateSocialLink(link) {
  const label = link.textContent.trim().toLowerCase();
  const key = Object.keys(SOCIAL_ICONS).find((k) => label.includes(k));
  if (key) {
    link.classList.add('nav-social-icon');
    link.setAttribute('aria-label', link.textContent.trim());
    link.setAttribute('title', link.textContent.trim());
    link.innerHTML = SOCIAL_ICONS[key];
  }
}

function decorateLocalePanel(panel) {
  [...panel.children].forEach((region, index) => {
    if (region.tagName !== 'LI') return;
    region.classList.add('region');
    if (index === 0) region.classList.add('two-col');
    const list = region.querySelector(':scope > ul');
    if (list) {
      list.classList.add('language-list');
      list.querySelectorAll(':scope > li').forEach((item) => item.classList.add('language-link'));
    }
  });
}

function cleanNavFragment(fragment) {
  fragment.querySelectorAll('script, style, noscript, iframe').forEach((el) => el.remove());
  fragment.querySelectorAll('[onclick], [ng-click], [ng-class], [ng-if], [ng-repeat], [ng-controller], [ng-app]')
    .forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (attr.name.startsWith('ng-') || attr.name === 'onclick') el.removeAttribute(attr.name);
      });
    });

  fragment.querySelectorAll('li > p').forEach((p) => {
    const onlyLink = p.children.length === 1 && p.firstElementChild.tagName === 'A';
    if (onlyLink && p.textContent.trim() === p.firstElementChild.textContent.trim()) {
      p.replaceWith(p.firstElementChild);
    }
  });

  fragment.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.remove();
  });
}

function sectionText(section) {
  return (section.textContent || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function classifyNavSections(nav) {
  const sections = [...nav.children].filter((child) => child.tagName === 'DIV');
  const brand = sections.find((section) => section.querySelector('img[alt*="moog" i], picture img'));
  const primary = sections.find((section) => {
    const text = sectionText(section);
    return section !== brand && text.includes('parts') && text.includes('support');
  });
  const tools = sections.find((section) => {
    const text = sectionText(section);
    return section !== brand
      && section !== primary
      && (
        text.includes('united states')
        || text.includes('light commercial')
        || text.includes('chassis system')
        || text.includes('facebook')
        || text.includes('youtube')
        || text.includes('instagram')
      );
  });
  const mobile = sections.find((section) => {
    const text = sectionText(section);
    return section !== brand && section !== primary && section !== tools && text.includes('home');
  });

  if (brand) brand.classList.add('nav-brand');
  if (primary) primary.classList.add('nav-sections');
  if (tools) tools.classList.add('nav-tools');
  if (mobile) mobile.classList.add('nav-mobile-source');

  return {
    brand,
    primary,
    tools,
    mobile,
  };
}

/**
 * Decorate the utility (tools) row: social icons, text links, locale dropdown.
 */
function decorateTools(navTools) {
  if (!navTools) return;
  const liveLocale = [...navTools.querySelectorAll('.region-and-language')]
    .find((el) => el.querySelector('.region-list')
      || (el.matches('.current-language') && el.parentElement?.querySelector(':scope > .region-list')));
  if (liveLocale) {
    const trigger = liveLocale.matches('.current-language') ? liveLocale : liveLocale.querySelector('.current-language');
    const localeRoot = trigger?.parentElement?.querySelector(':scope > .region-list') ? trigger.parentElement : liveLocale;
    const panel = localeRoot.querySelector(':scope > .region-list') || liveLocale.querySelector('.region-list');
    if (trigger && panel) {
      localeRoot.classList.add('nav-locale');
      trigger.classList.add('nav-locale-trigger');
      trigger.type = trigger.tagName === 'BUTTON' ? 'button' : trigger.type;
      panel.classList.add('nav-locale-panel');
      decorateLocalePanel(panel);
      localeRoot.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = localeRoot.getAttribute('aria-expanded') === 'true';
        localeRoot.setAttribute('aria-expanded', open ? 'false' : 'true');
        trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
        updatePageScrollLock(localeRoot.closest('nav'));
      });
    }
  }

  // social + text links live in <p> wrappers
  navTools.querySelectorAll('p > a').forEach((a) => {
    const wrapper = a.closest('p');
    const label = a.textContent.trim().toLowerCase();
    if (/instagram|youtube|facebook/.test(label)) {
      wrapper.classList.add('nav-social');
      decorateSocialLink(a);
    } else if (label.includes('light commercial')) {
      wrapper.classList.add('nav-lcv');
      a.classList.add('nav-lcv-button');
    } else {
      wrapper.classList.add('nav-utility-link');
    }
  });

  // locale selector: the <ul> at the end of the tools section
  const localeList = navTools.querySelector(':scope > ul, :scope > div > ul');
  if (localeList && !localeList.classList.contains('region-list')) {
    localeList.classList.add('nav-locale-list');
    const trigger = localeList.querySelector(':scope > li');
    const triggerLink = trigger.querySelector(':scope > a');
    const panel = trigger.querySelector(':scope > ul');
    if (triggerLink && panel) {
      trigger.classList.add('nav-locale');
      triggerLink.classList.add('nav-locale-trigger');
      triggerLink.setAttribute('role', 'button');
      panel.classList.add('nav-locale-panel');
      decorateLocalePanel(panel);
      trigger.setAttribute('aria-expanded', 'false');
      triggerLink.setAttribute('aria-expanded', 'false');
      triggerLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
        triggerLink.setAttribute('aria-expanded', open ? 'false' : 'true');
        updatePageScrollLock(trigger.closest('nav'));
      });
    }
  }
}

/**
 * Add a separate chevron button to a list item so the text link navigates while
 * the chevron toggles the accordion (split-link pattern). Returns the button.
 */
function addChevron(item, expandTarget, extraClass) {
  const chevron = document.createElement('button');
  chevron.type = 'button';
  chevron.className = `nav-chevron${extraClass ? ` ${extraClass}` : ''}`;
  chevron.setAttribute('aria-label', 'Expand');
  chevron.setAttribute('tabindex', '-1');
  chevron.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const open = expandTarget.getAttribute('aria-expanded') === 'true';
    expandTarget.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
  // place chevron right after the item's own anchor/header
  const anchor = item.querySelector(':scope > a') || item.firstElementChild;
  if (anchor && anchor.nextSibling) item.insertBefore(chevron, anchor.nextSibling);
  else item.append(chevron);
  return chevron;
}

/**
 * Turn a category list item (with a nested <ul> of leaf links) into a mobile
 * accordion: text link navigates, chevron expands the nested list in place.
 */
function decorateCategoryAccordion(li) {
  const sub = li.querySelector(':scope > ul');
  if (!sub) return;
  li.classList.add('nav-accordion');
  li.setAttribute('aria-expanded', 'false');
  sub.classList.add('nav-accordion-panel');
  addChevron(li, li, 'nav-accordion-chevron');
}

/**
 * Decorate the main nav menu: top-level links, megamenu triggers (items with nested <ul>).
 */
function decorateSections(navSections, nav, mobileExtras) {
  if (!navSections) return;
  const topUl = navSections.querySelector(':scope > ul, :scope > div > ul');
  if (topUl) topUl.classList.add('nav-menu');
  const topItems = topUl ? [...topUl.querySelectorAll(':scope > li')] : [];
  const homeItem = topItems.find((li) => li.querySelector(':scope > a')?.textContent.trim().toLowerCase() === 'home');
  const lcvItem = topItems.find((li) => li.querySelector(':scope > a')?.textContent.trim().toLowerCase() === 'light commercial vehicle');

  if (homeItem) homeItem.classList.add('nav-mobile-only', 'nav-mobile-home');
  if (lcvItem) lcvItem.classList.add('nav-mobile-only', 'nav-mobile-lcv');

  // Find My Part CTA — relocate to its own grid area (single instance, no clone)
  const ctaLink = [...navSections.querySelectorAll('a')]
    .find((a) => a.textContent.trim().toLowerCase() === 'find my part');
  if (ctaLink) {
    const ctaItem = ctaLink.closest('li');
    ctaLink.classList.add('nav-cta-button');
    const ctaHolder = document.createElement('div');
    ctaHolder.className = 'nav-cta-desktop';
    ctaHolder.append(ctaLink);
    nav.append(ctaHolder);
    if (ctaItem) ctaItem.remove();
  }

  // Mobile-only "Home" link prepended to the menu (hidden on desktop via CSS)
  if (topUl && mobileExtras && mobileExtras.home && !homeItem) {
    const homeLi = document.createElement('li');
    homeLi.className = 'nav-mobile-only nav-mobile-home';
    homeLi.append(mobileExtras.home);
    topUl.prepend(homeLi);
  }

  navSections.querySelectorAll(':scope .nav-menu > li').forEach((item) => {
    if (item.classList.contains('nav-mobile-only')) return;
    const panel = item.querySelector(':scope > ul');
    if (panel) {
      item.classList.add('nav-drop');
      item.setAttribute('aria-expanded', 'false');
      panel.classList.add('nav-megamenu');
      panel.querySelectorAll(':scope > li').forEach((col) => {
        col.classList.add('nav-megamenu-col');
        // nested category -> mobile accordion (e.g. Steering, Suspension...)
        decorateCategoryAccordion(col);
      });

      // chevron toggles the megamenu/accordion; text link navigates (split-link)
      addChevron(item, item, 'nav-drop-chevron');

      // Pointer hover opens the panel. On desktop only one is open at a time and
      // it closes on mouseleave. On mobile (touch) mouseenter does not fire, so the
      // chevron click remains the primary affordance and the accordion stays open;
      // fine-pointer/hybrid devices still get a hover affordance.
      item.addEventListener('mouseenter', () => {
        if (isDesktop.matches) closeAllMegamenus(nav);
        item.setAttribute('aria-expanded', 'true');
      });
      item.addEventListener('mouseleave', () => {
        if (isDesktop.matches) item.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Mobile-only "Light Commercial Vehicle" appended to the menu (hidden on desktop)
  if (topUl && mobileExtras && mobileExtras.lcv && !lcvItem) {
    const lcvLi = document.createElement('li');
    lcvLi.className = 'nav-mobile-only nav-mobile-lcv';
    lcvLi.append(mobileExtras.lcv);
    topUl.append(lcvLi);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (fragment) cleanNavFragment(fragment);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const navParts = classifyNavSections(nav);

  // the optional 4th section is mobile-only content (e.g. Home)
  const mobileExtras = {};
  if (navParts.mobile) {
    const homeLink = navParts.mobile.querySelector('a');
    if (homeLink) mobileExtras.home = homeLink;
    navParts.mobile.remove();
  }

  const navBrand = navParts.brand;
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) brandLink.classList.add('nav-brand-link');
    repairBrandLogo(navBrand);
  }

  const navTools = navParts.tools;
  decorateTools(navTools);

  // Light Commercial Vehicle is a utility-bar link on desktop but also a
  // top-level item in the mobile menu — clone it for the mobile menu list.
  const lcvLink = navTools ? navTools.querySelector('.nav-lcv a') : null;
  if (lcvLink) {
    const lcvClone = lcvLink.cloneNode(true);
    lcvClone.className = '';
    mobileExtras.lcv = lcvClone;
  }

  const navSections = navParts.primary;
  decorateSections(navSections, nav, mobileExtras);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, isDesktop.matches);

  // viewport resize handling: keep layout clean when crossing the breakpoint
  isDesktop.addEventListener('change', () => {
    // close mobile menu + reset hamburger, collapse any open accordions
    collapseAllAccordions(nav);
    closeAllMegamenus(nav);
    closeLocale(nav);
    toggleMenu(nav, navSections, isDesktop.matches);
  });

  // close open panels when clicking outside the nav
  document.addEventListener('click', (e) => {
    const localeOpen = nav.querySelector('.nav-locale[aria-expanded="true"]');
    if (localeOpen && !localeOpen.contains(e.target)) closeLocale(nav);
    if (!nav.contains(e.target)) {
      closeAllMegamenus(nav);
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
