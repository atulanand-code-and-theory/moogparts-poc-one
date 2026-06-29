/* eslint-disable */
/* global WebImporter */
/**
 * Parser for widget (local special block).
 * Sources:
 *   - https://www.moogparts.com/ and .../technologies.html  (.driv-part-finder-main → "part-finder")
 *   - https://www.moogparts.com/parts.html                  (.where-to-buy-link    → "where-to-buy")
 *   - technical-tool pages (interactive tool apps):
 *       .search-files            → "search-files"            (bulletin PDF search/listing)
 *       .diagnostic-center       → "diagnostic-center"       (symptom selector)
 *       .documents-autocomplete  → "documents-autocomplete"  (install-guide part-# search)
 *   - parts-category / parts-product pages (.ymm-search → "part-finder"): the
 *       Year/Make/Model part finder. It is functionally the same year/make/model
 *       lookup as the homepage `.driv-part-finder-main`, and the only shipped
 *       widget asset is `/widgets/part-finder.*`, so `.ymm-search` reuses the
 *       "part-finder" widget rather than introducing a non-existent asset.
 *   - standalone pages:
 *       .where-to-buy-search    → "where-to-buy"  (full ZIP/store locator on
 *                                  https://www.moogparts.com/where-to-buy.html;
 *                                  same widget asset as `.where-to-buy-link`)
 *       .documents-autocomplete → "documents-autocomplete"  (install-guide
 *                                  part-# search on
 *                                  https://www.moogparts.com/installation-guide-search.html)
 *       .driv-part-finder-main  → "part-finder"   (find-my-part.html)
 * Generated: 2026-06-27. Extended: 2026-06-28 (parts/technologies support;
 *   technical-tool search-files / diagnostic-center / documents-autocomplete;
 *   parts-category/parts-product `.ymm-search` year/make/model finder;
 *   standalone `.where-to-buy-search` ZIP/store locator).
 *
 * The local `blocks/widget` block embeds an interactive widget/app and
 * self-resolves its sub-name + CSS/JS from a single <a href> that points
 * to an asset under `/widgets/`. The live source containers (the runtime
 * part-finder / where-to-buy apps) have no embeddable href of their own, so
 * the parser self-names the widget from the source container class and
 * synthesizes the canonical widget reference link.
 *
 * Block convention: 1 column, 1 content row whose single cell contains the
 * widget source link.
 *
 * The intro section copy (heading + lead paragraph/sublabel) lives INSIDE the
 * source container before the runtime search panels. It is authorable section
 * content, so we lift it out as default content placed before the widget block
 * — otherwise it is lost when the container is replaced. The "Search by …"
 * sub-panel headings (rendered as <h4>) are part of the runtime widget UI and
 * load when the widget loads, so they are NOT authored here.
 */

// Map a source container class to its canonical widget reference name.
// The widget block decorator (`blocks/widget/widget.js`) derives the widget
// name from the href filename, so this name must match a file in `/widgets/`.
const WIDGET_NAME_BY_CLASS = [
  { className: 'driv-part-finder-main', name: 'part-finder' },
  { className: 'ymm-search', name: 'part-finder' },
  // Both the parts-page ZIP locator (`.where-to-buy-link`) and the standalone
  // where-to-buy page's full search widget (`.where-to-buy-search`) resolve to
  // the same `/widgets/where-to-buy.*` asset.
  { className: 'where-to-buy-link', name: 'where-to-buy' },
  { className: 'where-to-buy-search', name: 'where-to-buy' },
  { className: 'search-files', name: 'search-files' },
  { className: 'diagnostic-center', name: 'diagnostic-center' },
  { className: 'documents-autocomplete', name: 'documents-autocomplete' },
];

function resolveWidgetName(element) {
  // Prefer the matched element's own class, then any descendant marker.
  const found = WIDGET_NAME_BY_CLASS.find(({ className }) => (
    element.classList.contains(className) || element.querySelector(`.${className}`)
  ));
  return found ? found.name : 'part-finder';
}

export default function parse(element, { document }) {
  // Self-name the widget from the source container class.
  const widgetName = resolveWidgetName(element);

  // Preserve the section heading + intro copy as default content. The
  // container is nested (outer wrapper + inner component div), so the copy is
  // made up of descendants, not direct children. Skip the runtime sub-panel
  // headings (<h4>/<h5> inside the search UI) by only lifting the FIRST
  // heading (h1-h3) and the first lead paragraph / sublabel.
  const preserved = [];

  // First real heading (h1-h3). `.where-to-buy-link` ships two visually
  // duplicated h2s (an icon "Where To Buy" + a "Where to Buy" label); take the
  // first that has text.
  const heading = Array.from(element.querySelectorAll('h1, h2, h3'))
    .find((h) => h.textContent.trim().length > 0);
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.trim();
    preserved.push(h2);
  }

  // Lead copy: a <p> intro (part-finder) or a sub-label heading such as an
  // <h5> "Find a MOOG part near you." (where-to-buy). Prefer a <p>; fall back
  // to an <h4>/<h5> sublabel that is NOT one of the runtime "Search by" panels.
  let intro = element.querySelector('p');
  if (!intro || !intro.textContent.trim()) {
    intro = Array.from(element.querySelectorAll('h4, h5'))
      .find((h) => /\b(find|near you|locator)\b/i.test(h.textContent)) || null;
  }
  if (intro && intro.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = intro.textContent.trim();
    preserved.push(p);
  }

  // The widget block decorator reads `widget.querySelector('a[href]')` and
  // parses the pathname to resolve `/widgets/<path>/<name>.{html,css,js}`.
  const link = document.createElement('a');
  link.href = `/widgets/${widgetName}.html`;
  link.textContent = `/widgets/${widgetName}.html`;

  // 1-column block: one row, one cell holding the link.
  const cells = [[link]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'widget', cells });
  // Insert preserved default content before the block, then swap in the block.
  preserved.forEach((node) => element.parentNode.insertBefore(node, element));
  element.replaceWith(block);
}
