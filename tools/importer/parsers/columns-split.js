/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-split. Base: columns.
 * Sources:
 *   - https://www.moogparts.com/ (#page-content .responsivegrid .aem-Grid--12 > .responsivegrid:has(.text-content))
 *     — AEM responsivegrid of alternating text|image split rows (bulletins / diagnostic band).
 *   - https://www.moogparts.com/technologies.html (.tout)
 *     — 4 side-by-side image+text promo rows; the selector matches each `.tout`
 *       individually, so siblings are consolidated into ONE block.
 *   - https://www.moogparts.com/technical.html etc. (.tout) — technical-landing
 *     pages stack up to 5 sibling `.tout` feature rows that may be INTERLEAVED
 *     with `.block-separator` divider divs. We consolidate all sibling `.tout`s
 *     into one columns block; `.block-separator` siblings are ignored here (the
 *     cleanup transformer removes them) because we only ever query `> .tout`.
 *   - https://www.moogparts.com/technical/training/know-your-parts.html (.tout)
 *     — a SINGLE `.tout` intro on the content-article gap page. The same
 *       consolidation logic handles the 1-tout case (group of one).
 * Generated: 2026-06-27. Extended: 2026-06-28 (technologies `.tout` support;
 *   technical-landing 1..N touts with interleaved `.block-separator` dividers;
 *   content-article single `.tout` intro).
 *
 * Columns library convention: first row = block name; each subsequent row has
 * the same number of columns. Here every content row is a 2-column split
 * (image + text). We preserve the source visual order of each row.
 */

const hasText = (el) => !!el && el.textContent.trim().length > 0;

/**
 * Build a text cell (heading + paragraphs + CTA links) from a container,
 * de-duplicating links already nested in collected paragraphs.
 */
function buildTextCell(inner, document) {
  const parts = [];
  const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');
  if (hasText(heading)) parts.push(heading);
  inner.querySelectorAll('p').forEach((p) => {
    if (hasText(p) || p.querySelector('img, a')) parts.push(p);
  });
  inner.querySelectorAll('a[href]').forEach((a) => {
    if (!hasText(a) && !a.querySelector('img, picture')) return;
    if (!parts.some((node) => node.contains && node.contains(a))) parts.push(a);
  });
  return parts.length ? parts : '';
}

/**
 * technologies.html layout: the matched element is a single `.tout` promo row
 * (image | title + paragraph + "Learn More"). All sibling `.tout`s belong to
 * the same feature-row group, so the first one builds the consolidated block
 * and the rest remove themselves.
 */
function parseTout(element, { document }) {
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
    // Image column — the showcase image.
    const img = tout.querySelector('.tout-showcase .showcase-image img, .showcase-image img, .tout-showcase img, img');

    // Text column — title + paragraph + CTA. Exclude the invisible
    // `.tout-wide-link` overlay anchor (it wraps the whole card and has no
    // text) by sourcing content from `.tout-content`.
    const content = tout.querySelector('.tout-content') || tout;
    const textCell = buildTextCell(content, document);

    if (img || (Array.isArray(textCell) && textCell.length)) {
      cells.push([img || '', textCell]);
    }
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return true;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-split', cells });
  element.replaceWith(block);
  groupTouts.slice(1).forEach((t) => t.remove());
  return true;
}

export default function parse(element, { document }) {
  // --- technologies.html `.tout` promo rows ---
  if (element.classList.contains('tout')) {
    if (parseTout(element, { document })) return;
  }

  // --- homepage AEM responsivegrid split rows ---
  const cells = [];

  // Find every grid that directly contains a text column and an image column.
  const grids = Array.from(element.querySelectorAll('.aem-Grid'));

  const rows = [];
  grids.forEach((grid) => {
    const cols = Array.from(grid.children).filter((child) => (
      child.querySelector(':scope > .text-content, :scope .text-content')
      || child.querySelector(':scope .image, :scope > .image')
      || child.classList.contains('image')
      || child.classList.contains('fmmp-plaintext')
    ));
    const textCols = cols.filter((c) => c.querySelector('.text-content') || c.classList.contains('fmmp-plaintext'));
    const imageCols = cols.filter((c) => (c.classList.contains('image') || c.querySelector(':scope > .image, :scope .image img')) && !c.querySelector('.text-content'));
    if (textCols.length >= 1 && imageCols.length >= 1 && cols.length >= 2) {
      rows.push(cols);
    }
  });

  rows.forEach((cols) => {
    // Sort columns by document order to preserve visual left-to-right layout.
    const ordered = cols.slice().sort((a, b) => (
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    ));

    const rowCells = ordered.map((col) => {
      const isImage = (col.classList.contains('image') || (col.querySelector('img') && !col.querySelector('.text-content')));
      if (isImage) {
        const img = col.querySelector('img');
        return img || '';
      }
      const inner = col.querySelector('.text-content') || col;
      return buildTextCell(inner, document);
    });

    while (rowCells.length < 2) rowCells.push('');
    const finalRow = rowCells.slice(0, 2);

    const hasContent = finalRow.some((cell) => (
      (Array.isArray(cell) && cell.length > 0) || (cell && cell.nodeType)
    ));
    if (hasContent) cells.push(finalRow);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-split', cells });
  element.replaceWith(block);
}
