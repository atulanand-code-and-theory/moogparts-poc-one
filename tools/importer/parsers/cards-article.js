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
 * Generated: 2026-06-27. Extended: 2026-06-28 (technologies `.ledes` support;
 *   technical-tool `.cross-sell` product cards).
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

  items.forEach((item) => {
    // --- Cell 1: image ---
    const img = item.querySelector('.image img, img');

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

    // "View ..." CTA link.
    const cta = item.querySelector('a[href]');
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
