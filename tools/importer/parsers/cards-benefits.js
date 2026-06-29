/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-benefits. Base: cards (no-images / text-only grid).
 * Source:
 *   - https://www.moogparts.com/parts/steering/idler-arms.html and sibling
 *     parts-product pages (.product-benefits) — the "Quick-Look Benefits" grid.
 *     NOTE: not every parts-product page renders this section (e.g.
 *     constant-velocity-axles / couplers omit it), so the parser bails
 *     gracefully when no `.product-benefit` items are present.
 * Generated: 2026-06-28. Matches the "Cards (no images)" convention: 1 column,
 *   one card per row, each cell holding a heading (label) + description.
 *
 * Source shape (`.product-benefits`):
 *   .product-benefits-container
 *     h2.product-benefits-headline  "Quick-Look Benefits"   (section heading —
 *        authored default content, NOT a card; lifted out before the block)
 *     .columns-4
 *       .product-benefit  (one per benefit, ~4 of them)
 *         p.h5-rep            short bold label ("Innovative" / "Durable" / ...)
 *         .product-benefit-content > p   one-line description
 *
 * Block convention ("Cards (no images)"): 1 column, multiple rows.
 *   Row 1: block name.
 *   Each subsequent row = one benefit card, a single cell holding the label
 *   (as a heading) followed by its description paragraph. The local
 *   `blocks/cards-benefits/cards-benefits.js` decorator reads each row's
 *   children into one <li>, then tags the first heading/paragraph as the
 *   `.cards-benefits-label`, so emitting [label-heading, description] per row
 *   matches the structure it expects.
 */

const hasText = (el) => !!el && (el.textContent || '').trim().length > 0;

export default function parse(element, { document }) {
  // The "Quick-Look Benefits" headline is section-level default content, not a
  // card. Lift it out so it is preserved when the container is replaced.
  const headline = element.querySelector('.product-benefits-headline, h1, h2');

  const items = Array.from(element.querySelectorAll('.product-benefit'));

  const cells = [];
  items.forEach((item) => {
    const cell = [];

    // Label — the short bold word. Promote to a heading so the decorator can
    // mark it as the benefit label.
    const labelEl = item.querySelector('.h5-rep, h1, h2, h3, h4, h5, h6, p');
    if (labelEl && hasText(labelEl)) {
      const h3 = document.createElement('h3');
      h3.textContent = labelEl.textContent.trim();
      cell.push(h3);
    }

    // Description — the explanatory paragraph(s) inside the content wrapper,
    // excluding the label paragraph already captured above.
    const descRoot = item.querySelector('.product-benefit-content') || item;
    Array.from(descRoot.querySelectorAll('p'))
      .filter((p) => p !== labelEl && hasText(p))
      .forEach((p) => {
        const para = document.createElement('p');
        para.textContent = p.textContent.replace(/\s+/g, ' ').trim();
        cell.push(para);
      });

    // 1-column row: one cell holding label + description.
    if (cell.length) cells.push([cell]);
  });

  // Empty-block guard — pages without a Quick-Look Benefits section land here.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-benefits', cells });
  // Place the section headline before the block as default content.
  if (headline && hasText(headline)) {
    const h2 = document.createElement('h2');
    h2.textContent = headline.textContent.trim();
    element.parentNode.insertBefore(h2, element);
  }
  element.replaceWith(block);
}
