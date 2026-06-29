/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Sources:
 *   - https://www.moogparts.com/ (.ledes .ledes-container) — Parts Matter ledes
 *   - https://www.moogparts.com/technologies.html (.ledes) — Technology Articles grid
 *   - technical-tool pages (.cross-sell) — "Other Parts For Your Vehicle" band:
 *       each `.cross-sell-item` is one card (image + H3 title + paragraph +
 *       "View ..." CTA link), under a `.cross-sell-items` container. The
 *       `.cross-sell-header` heading is default content owned by the section,
 *       so it is excluded here.
 *   - https://www.moogparts.com/parts/steering.html (.main-par .tout) —
 *       parts-category product-type card grid. Each `.tout` is one product card
 *       (showcase image + H3 title + one-line description + "View Product"
 *       CTA). The page-templates selector matches EACH `.tout` individually, so
 *       sibling `.tout`s are consolidated into ONE cards-article block (the
 *       first tile builds it, the rest remove themselves). NOTE: the
 *       `columns-split` parser ALSO matches `.tout` (for the technologies /
 *       technical feature-row use); the two never collide because they are
 *       invoked per-template via different selectors and each scopes its work
 *       to the matched element. Here a `.tout` becomes a multi-card grid, not a
 *       full-width feature row.
 *   - https://www.moogparts.com/about.html (.timeline) — standalone "Our
 *       History" timeline. Each `.timeline-item` is one entry: an optional
 *       `.timeline-showcase img`, a year label (`<h2><span>YEAR</span></h2>`),
 *       an entry title (`<h4>`), and a description (`.timeline-item-copy p`).
 *       Each entry becomes one 2-column card: image cell | (year heading +
 *       title heading + description). Empty `<h5>` placeholders are skipped.
 *   - https://www.moogparts.com/light-commercial-vehicle.html
 *       (.carousel-container) — standalone "Popular Applications" spotlight
 *       carousel. Each `.tout-slide` is one slide: a `.tout-image
 *       .preview-img`, a title (`.tout-content .content p`), and an optional
 *       "Download PDF" CTA (`.slide-cta a`). Each slide becomes one 2-column
 *       card: image | (title + optional CTA). The page wraps an inner
 *       `.carousel-container` inside the outer one; only the OUTERMOST match is
 *       processed and slick clones are de-duplicated, so each slide emits once.
 * Generated: 2026-06-27. Extended: 2026-06-28 (technologies `.ledes` support;
 *   technical-tool `.cross-sell` product cards; parts-category `.main-par .tout`
 *   product-card grid; standalone `.timeline` history + `.carousel-container`
 *   application-spotlight cards).
 *
 * Cards library convention: 2 columns, multiple rows. First row = block name.
 * Each subsequent row is one card:
 *   Cell 1: image (mandatory)
 *   Cell 2: text content — title (heading/link), description, CTA link
 *
 * Source: each `.lede` is one article teaser card with:
 *   - image inside `.lede-image img`
 *   - title link `a.lede-title`
 *   - teaser paragraph `p.lede-teaser-text`
 *   - "Read More" CTA `a.cta-link`
 *
 * Both pages share the `.lede` card structure, so iterating `.lede` works for
 * either selector (`.ledes` vs `.ledes .ledes-container`). The technologies
 * page also renders a "View More" button inside a `.view-more` wrapper (NOT a
 * `.lede`), so it is naturally excluded — we only ever read `.lede` cards and
 * their inner `.lede-*` elements, never the load-more control.
 */
/**
 * technical-tool `.cross-sell` band: each `.cross-sell-item` is one product
 * card (image + H3 title + paragraph + "View ..." CTA). The `.cross-sell-header`
 * heading/intro is default content owned by the section and is NOT collected.
 */
function parseCrossSell(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cross-sell-item'));
  const cells = [];

  // On runtime-bound pages (e.g. standalone where-to-buy), `.cross-sell` is an
  // Angular `ng-repeat` template whose single `.cross-sell-item` carries only
  // `{{ }}` bindings / `ng-src` (no real content until hydration). Such items
  // have no usable image src and no static text, so they are skipped below and
  // the empty-block guard lets the section fall back to default content.

  items.forEach((item) => {
    // --- Cell 1: image (only a real, hydrated `src`, not an `ng-src` binding) ---
    const imgEl = item.querySelector('.image img, img');
    const imgSrc = imgEl ? (imgEl.getAttribute('src') || '') : '';
    const img = imgEl && imgSrc && !/\{\{/.test(imgSrc) ? imgEl : null;

    // --- Cell 2: text content ---
    const textCell = [];

    // Title (rendered as an H3 in source).
    const title = item.querySelector('h3, h2, .cross-sell-title');
    if (title && title.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      textCell.push(h3);
    }

    // Description paragraph (skip empty/binding placeholders).
    const desc = item.querySelector('p');
    if (desc && desc.textContent.trim()) textCell.push(desc);

    // "View ..." CTA link (skip `ng-href` binding-only anchors with no href).
    const cta = item.querySelector('a[href]');
    const ctaHref = cta ? (cta.getAttribute('href') || '') : '';
    if (cta && cta.textContent.trim() && ctaHref && !/\{\{/.test(ctaHref)) {
      const a = document.createElement('a');
      a.href = ctaHref;
      a.textContent = cta.textContent.replace(/\s+/g, ' ').trim();
      textCell.push(a);
    }

    // Only emit a card when the item has a real image or real text. This drops
    // unhydrated `ng-repeat` placeholder items.
    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return true;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
  return true;
}

/**
 * parts-category `.main-par .tout` product-card grid. The selector matches each
 * `.tout` individually, so sibling `.tout`s are consolidated into ONE
 * cards-article block: the first tile in the group builds the block and the
 * rest remove themselves (mirrors the columns-split tout consolidation, but
 * emits a 2-column CARD per tile, not a feature row).
 *
 * Each `.tout` card:
 *   Cell 1: showcase image (`.tout-showcase .showcase-image img`)
 *   Cell 2: H3 title + one-line description <p> + "View Product" CTA
 *           (`.tout-cta a`). The invisible `.tout-wide-link` full-card overlay
 *           anchor has no text and is sourced-around via `.tout-content`.
 */
function parseToutCards(element, { document }) {
  const parent = element.parentElement;
  const touts = parent
    ? Array.from(parent.querySelectorAll(':scope > .tout'))
    : [element];

  // Only the first tile in the group builds the block.
  if (touts.length && touts[0] !== element) {
    element.remove();
    return true;
  }

  const groupTouts = touts.length ? touts : [element];
  const cells = [];

  groupTouts.forEach((tout) => {
    // --- Cell 1: image ---
    const img = tout.querySelector('.tout-showcase .showcase-image img, .showcase-image img, .tout-showcase img, img');

    // --- Cell 2: text content (sourced from `.tout-content`) ---
    const content = tout.querySelector('.tout-content') || tout;
    const textCell = [];

    const title = content.querySelector('h1, h2, h3, h4, h5, h6');
    if (title && title.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      textCell.push(h3);
    }

    const desc = content.querySelector('p');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      textCell.push(p);
    }

    // "View Product" CTA — the visible button-arrow anchor inside `.tout-cta`.
    // Skip the invisible `.tout-wide-link` overlay anchor (no text).
    const cta = content.querySelector('.tout-cta a[href], a.button-main[href], a.button-arrow[href]');
    if (cta && cta.textContent.trim()) {
      const a = document.createElement('a');
      a.href = cta.getAttribute('href') || '#';
      a.textContent = cta.textContent.replace(/\s+/g, ' ').trim();
      textCell.push(a);
    }

    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return true;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
  groupTouts.slice(1).forEach((t) => t.remove());
  return true;
}

/**
 * standalone `.timeline` "Our History" band: each `.timeline-item` is one entry
 * with an optional showcase image, a year label (`<h2><span>YEAR</span></h2>`),
 * an entry title (`<h4>`), and a description paragraph (`.timeline-item-copy p`).
 * Each entry becomes one 2-column card row: image cell | text cell holding a
 * year heading + title heading + description. Empty `<h5>` spacer placeholders
 * are ignored. Entries without an image still emit a row (empty image cell) so
 * the 2-column structure stays uniform.
 */
function parseTimeline(element, { document }) {
  const items = Array.from(element.querySelectorAll('.timeline-item'));
  const cells = [];

  items.forEach((item) => {
    // --- Cell 1: image (optional) ---
    const img = item.querySelector('.timeline-showcase img, img');

    // --- Cell 2: text content ---
    const textCell = [];

    // Year label: `<h2><span>YEAR</span></h2>`. Render as a heading.
    const yearEl = item.querySelector('h2');
    const yearText = yearEl ? yearEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (yearText) {
      const h3 = document.createElement('h3');
      h3.textContent = yearText;
      textCell.push(h3);
    }

    // Entry title: `<h4>`. Skip empty `<h5>` spacer placeholders.
    const titleEl = item.querySelector('h4, h3:not(:first-of-type)');
    if (titleEl && titleEl.textContent.trim()) {
      const h4 = document.createElement('h4');
      // Preserve inline markup (e.g. ampersands rendered as entities).
      h4.innerHTML = titleEl.innerHTML;
      textCell.push(h4);
    }

    // Description: paragraph(s) inside `.timeline-item-copy`. Preserve inline
    // markup such as the `<sup>` registered-trademark glyphs.
    const copy = item.querySelector('.timeline-item-copy');
    if (copy) {
      Array.from(copy.querySelectorAll('p'))
        .filter((p) => p.textContent.trim())
        .forEach((p) => textCell.push(p));
    }

    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return true;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
  return true;
}

/**
 * standalone `.carousel-container` "Popular Applications" spotlight carousel:
 * each `.tout-slide` is one slide with a preview image, a title paragraph, and
 * an optional "Download PDF" CTA. Each slide becomes one 2-column card row:
 * image cell | text cell (title heading + optional CTA link).
 *
 * The page nests an inner `.carousel-container` inside the outer matched one,
 * so only the OUTERMOST `.carousel-container` is processed (an inner match
 * bails to its ancestor). Slick may render duplicate/cloned slides; slides are
 * de-duplicated by their `slideN` ordinal class so each spotlight emits once.
 */
function parseCarousel(element, { document }) {
  // Only the outermost carousel-container builds the block; an inner/nested
  // match removes itself so its slides are not emitted twice.
  if (element.parentElement && element.parentElement.closest('.carousel-container')) {
    element.remove();
    return true;
  }

  const allSlides = Array.from(element.querySelectorAll('.tout-slide'));
  // De-duplicate slick clones: keep the first slide per ordinal `slideN` class.
  const seen = new Set();
  const slides = allSlides.filter((slide) => {
    const ordinal = Array.from(slide.classList).find((c) => /^slide\d+$/.test(c));
    const key = ordinal || `idx-${allSlides.indexOf(slide)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const cells = [];

  slides.forEach((slide) => {
    // --- Cell 1: image ---
    const img = slide.querySelector('.tout-image .preview-img, .tout-image img, img.preview-img, img');

    // --- Cell 2: text content ---
    const textCell = [];

    // Title: paragraph inside `.tout-content .content`. Use plain text wrapped
    // in a heading (source styles it bold/uppercase inline).
    const titleP = slide.querySelector('.tout-content .content p, .tout-content p, .content p');
    if (titleP && titleP.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = titleP.textContent.replace(/\s+/g, ' ').trim();
      textCell.push(h3);
    }

    // Optional "Download PDF" CTA.
    const cta = slide.querySelector('.slide-cta a[href], a.button-main[href], a.button-arrow[href]');
    if (cta && cta.textContent.trim()) {
      const a = document.createElement('a');
      a.href = cta.getAttribute('href') || '#';
      a.textContent = cta.textContent.replace(/\s+/g, ' ').trim();
      textCell.push(a);
    }

    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return true;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
  return true;
}

export default function parse(element, { document }) {
  // --- standalone `.timeline` "Our History" band ---
  if (element.classList.contains('timeline') || element.querySelector('.timeline-item')) {
    if (parseTimeline(element, { document })) return;
  }

  // --- standalone `.carousel-container` application-spotlight carousel ---
  if (element.classList.contains('carousel-container') || element.querySelector('.tout-slide')) {
    if (parseCarousel(element, { document })) return;
  }

  // --- parts-category `.main-par .tout` product-card grid ---
  // Scope strictly to the matched `.tout` element; do NOT treat `.lede`/
  // `.cross-sell` elements as touts.
  if (element.classList.contains('tout')) {
    if (parseToutCards(element, { document })) return;
  }

  // --- technical-tool `.cross-sell` product cards band ---
  if (element.classList.contains('cross-sell') || element.querySelector('.cross-sell-item')) {
    if (parseCrossSell(element, { document })) return;
  }

  // Each `.lede` is one card. The "View More" button lives in `.view-more`
  // (outside any `.lede`) and is intentionally not collected here.
  const cards = Array.from(element.querySelectorAll('.lede'));
  const cells = [];

  cards.forEach((card) => {
    // --- Cell 1: image ---
    const img = card.querySelector('.lede-image img, figure img, img');

    // --- Cell 2: text content ---
    const textCell = [];

    // Title (rendered as a link). Wrap in a heading so it styles as a card title.
    const titleLink = card.querySelector('a.lede-title, .lede-title');
    if (titleLink && titleLink.textContent.trim()) {
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = titleLink.getAttribute('href') || '#';
      a.textContent = titleLink.textContent.trim();
      h3.appendChild(a);
      textCell.push(h3);
    }

    // Description / teaser paragraph
    const teaser = card.querySelector('p.lede-teaser-text, .lede-teaser p, p');
    if (teaser && teaser.textContent.trim()) textCell.push(teaser);

    // CTA "Read More" link
    const cta = card.querySelector('a.cta-link, .lede-teaser a.lede-teaser-cta');
    if (cta && cta.textContent.trim()) textCell.push(cta);

    // Only emit a card row if it has any content.
    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
