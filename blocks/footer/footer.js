import { getMetadata } from '../../scripts/aem.js';

/**
 * Fetches the footer fragment markup, trying the local preview path first and
 * falling back to the authored document path for DA/EDS production.
 * @param {string} footerPath Path to the footer document without the .plain.html suffix
 * @returns {Promise<string>} The fragment HTML, or an empty string on failure
 */
async function fetchFooterFragment(footerPath) {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    resp = await fetch(`${footerPath}.plain.html`);
  }
  if (!resp.ok) return '';
  return resp.text();
}

/**
 * Parses fragment HTML into an array of top-level section elements.
 * @param {string} html Raw fragment HTML
 * @returns {Element[]} Top-level section elements
 */
function parseSections(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return [...tmp.children];
}

/**
 * Applies a class to an element and returns it for chaining.
 * @param {Element} el Target element
 * @param {string} className Class to add
 * @returns {Element} The same element
 */
function withClass(el, className) {
  if (el) el.classList.add(className);
  return el;
}

/**
 * Wires an expand/collapse toggle: the trigger shows or hides the target panel.
 * @param {HTMLAnchorElement} trigger The toggle link
 * @param {Element} panel The panel to expand/collapse
 */
function wireToggle(trigger, panel) {
  if (!trigger || !panel) return;
  const setState = (open) => {
    panel.classList.toggle('open', open);
    trigger.classList.toggle('open', open);
    trigger.setAttribute('aria-expanded', String(open));
  };
  setState(false);
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    setState(!panel.classList.contains('open'));
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname.replace(/\.plain\.html$/, '')
    : '/footer';

  const html = await fetchFooterFragment(footerPath);
  const sections = parseSections(html);

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-content';

  // Map sections by position to semantic roles (generic, order-based).
  const [sitemap, menu, banner, bottomBar] = sections;

  withClass(sitemap, 'footer-sitemap');
  withClass(menu, 'footer-menu');
  withClass(banner, 'footer-banner');
  withClass(bottomBar, 'footer-bottom-bar');

  sections.forEach((section) => {
    if (section) footer.append(section);
  });

  // Wire the sitemap toggle: a menu link pointing at the sitemap anchor controls it.
  if (menu && sitemap) {
    const toggle = [...menu.querySelectorAll('a')].find((a) => {
      const href = a.getAttribute('href') || '';
      return href.startsWith('#');
    });
    if (toggle) {
      withClass(toggle, 'footer-sitemap-toggle');
      wireToggle(toggle, sitemap);
    }
  }

  block.append(footer);
}
