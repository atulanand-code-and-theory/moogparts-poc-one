/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Sources:
 *   - https://www.moogparts.com/ (.ledes .ledes-container) — Parts Matter ledes
 *   - https://www.moogparts.com/technologies.html (.ledes) — Technology Articles grid
 * Generated: 2026-06-27. Extended: 2026-06-28 (technologies `.ledes` support).
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
export default function parse(element, { document }) {
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
