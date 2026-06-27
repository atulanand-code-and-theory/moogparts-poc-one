/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-category. Base: cards.
 * Source: https://www.moogparts.com/ (.hover-tout)
 * Generated: 2026-06-27
 *
 * Cards library convention: 2 columns, multiple rows. First row = block name.
 * Each subsequent row is one card:
 *   Cell 1: image (mandatory)
 *   Cell 2: text content — title (heading), CTA link
 *
 * Source note: the selector targets each individual `.hover-tout` tile (there
 * are 4: Steering, Suspension, Driveline, Wheel End), all sharing one parent
 * grid. We consolidate every sibling tile into a SINGLE cards block. To avoid
 * emitting one block per tile, only the first tile in the group builds the
 * block; the remaining tiles remove themselves.
 *
 * Each tile contains:
 *   - background image inside `.bg img`
 *   - centered title in `.tout-title` (wrapped in <span>)
 *   - "See Products" CTA as a <button> inside an <a href> linking the category
 */
export default function parse(element, { document }) {
  // Collect all sibling tiles in the same parent group, in document order.
  const parent = element.parentElement;
  const tiles = parent
    ? Array.from(parent.querySelectorAll(':scope > .hover-tout'))
    : [element];

  // If this isn't the first tile in the group, it has already been (or will be)
  // consumed by the first tile's invocation — remove it and bail.
  if (tiles.length && tiles[0] !== element) {
    element.remove();
    return;
  }

  const groupTiles = tiles.length ? tiles : [element];
  const cells = [];

  groupTiles.forEach((tile) => {
    // --- Cell 1: image ---
    // Live tiles render the background as an <img> (possibly lazy-loaded via
    // data-src), a <picture>, or a CSS background-image on `.bg`/`.has-bg`.
    let img = tile.querySelector('.bg img, .has-bg img, img');
    if (img) {
      // Resolve lazy-loaded sources so the image isn't dropped as empty-src.
      const realSrc = img.getAttribute('src')
        || img.getAttribute('data-src')
        || img.getAttribute('data-original')
        || img.getAttribute('data-lazy-src');
      if (realSrc) {
        img.setAttribute('src', realSrc);
      } else {
        const srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset');
        if (srcset) img.setAttribute('src', srcset.split(',')[0].trim().split(' ')[0]);
      }
      if (!img.getAttribute('src')) img = null;
    }
    if (!img) {
      const pic = tile.querySelector('.bg picture, .has-bg picture, picture');
      if (pic && pic.querySelector('img[src], source[srcset]')) img = pic;
    }
    if (!img) {
      // Inline CSS background-image fallback.
      const bgEl = tile.querySelector('.bg, .has-bg') || tile;
      const style = bgEl.getAttribute('style') || '';
      const m = style.match(/url\((['"]?)(.*?)\1\)/i);
      if (m && m[2]) {
        const synth = document.createElement('img');
        synth.src = m[2];
        img = synth;
      }
    }

    // --- Cell 2: text content (title + CTA) ---
    const textCell = [];

    // The whole tile is wrapped in an anchor (the category link).
    const tileLink = tile.querySelector('a[href]');
    const href = tileLink ? tileLink.getAttribute('href') : null;

    // Title — `.tout-title` (may contain a nested <span>).
    const titleEl = tile.querySelector('.tout-title, h1, h2, h3, h4, h5, h6');
    const titleText = titleEl ? titleEl.textContent.trim() : '';
    if (titleText) {
      const h3 = document.createElement('h3');
      h3.textContent = titleText;
      textCell.push(h3);
    }

    // CTA — the "See Products" button becomes a real link to the category.
    const ctaBtn = tile.querySelector('.cta-container button, button, .cta-container a, a.button-main');
    const ctaText = ctaBtn ? ctaBtn.textContent.trim() : '';
    if (href && ctaText) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = ctaText;
      textCell.push(a);
    } else if (href && titleText && textCell.length) {
      // Fallback: link the title's category even without explicit CTA text.
      const a = document.createElement('a');
      a.href = href;
      a.textContent = 'See Products';
      textCell.push(a);
    }

    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-category', cells });

  // Replace the first tile with the consolidated block and remove the rest.
  element.replaceWith(block);
  groupTiles.slice(1).forEach((t) => t.remove());
}
