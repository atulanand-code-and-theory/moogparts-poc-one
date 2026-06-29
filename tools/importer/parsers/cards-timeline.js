/* eslint-disable */
/* global WebImporter */

/**
 * cards-timeline parser — MOOG "Our History" vertical timeline.
 *
 * A cards-style block: the generated table has 2 columns and multiple rows; the
 * first row is just the block name, and each subsequent row is one card with an
 * image in the first cell and text content (year + title headings, description)
 * in the second cell.
 *
 * Source: https://www.moogparts.com/about.html (`.timeline`). Each
 * `.timeline-item` is one entry: an optional showcase image
 * (`.timeline-showcase img`), a year label (`<h2><span>YEAR</span></h2>`), an
 * entry title (`<h4>`), and a description (`.timeline-item-copy p`). Empty
 * `<h5>` spacers are ignored. Entries without an image still emit a row (empty
 * first cell) so the 2-column structure stays uniform.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.timeline-item'));
  const cells = [];

  items.forEach((item) => {
    // First cell: card image (optional).
    const img = item.querySelector('.timeline-showcase img, img');

    // Second cell: text content (year heading + title heading + description).
    const textCell = [];

    const yearEl = item.querySelector('h2');
    const yearText = yearEl ? yearEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (yearText) {
      const h3 = document.createElement('h3');
      h3.textContent = yearText;
      textCell.push(h3);
    }

    const titleEl = item.querySelector('h4, h3:not(:first-of-type)');
    if (titleEl && titleEl.textContent.trim()) {
      const h4 = document.createElement('h4');
      h4.innerHTML = titleEl.innerHTML;
      textCell.push(h4);
    }

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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-timeline', cells });
  element.replaceWith(block);
  return true;
}
