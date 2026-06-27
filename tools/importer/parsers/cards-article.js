/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://www.moogparts.com/ (.ledes .ledes-container)
 * Generated: 2026-06-27
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
 */
export default function parse(element, { document }) {
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
