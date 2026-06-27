/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-split. Base: columns.
 * Source: https://www.moogparts.com/
 *   (#page-content .responsivegrid .aem-Grid--12 > .responsivegrid:has(.text-content))
 * Generated: 2026-06-27
 *
 * Columns library convention: first row = block name; each subsequent row has
 * the same number of columns. Here the layout is a set of 2-column split rows
 * (text + image), where order alternates: row 1 is text|image, row 2 is
 * image|text. We preserve the source visual order of each row.
 *
 * Structure of the matched element: an AEM responsivegrid wrapping multiple
 * split rows. Each split row pairs a `.fmmp-plaintext`/`.text-content` cell
 * with an `.image` cell. We detect each row's grid and emit its columns in
 * DOM order so image-first rows stay image-first.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find every grid that directly contains a text column and an image column.
  // A "row grid" is an .aem-Grid whose children include a text column and/or
  // an image column.
  const grids = Array.from(element.querySelectorAll('.aem-Grid'));

  const rows = [];
  grids.forEach((grid) => {
    // Direct column children of this grid (text or image columns only).
    const cols = Array.from(grid.children).filter((child) => (
      child.querySelector(':scope > .text-content, :scope .text-content')
      || child.querySelector(':scope .image, :scope > .image')
      || child.classList.contains('image')
      || child.classList.contains('fmmp-plaintext')
    ));
    // A valid split row has at least 2 such columns.
    const textCols = cols.filter((c) => c.querySelector('.text-content') || c.classList.contains('fmmp-plaintext'));
    const imageCols = cols.filter((c) => (c.classList.contains('image') || c.querySelector(':scope > .image, :scope .image img')) && !c.querySelector('.text-content'));
    if (textCols.length >= 1 && imageCols.length >= 1 && cols.length >= 2) {
      rows.push(cols);
    }
  });

  // Build each row in source (visual) order. Each column cell contains the
  // meaningful content of that column: heading/paragraphs/CTAs for text, the
  // <img> for image columns.
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
      // Text column: collect heading, paragraphs, and CTA links.
      const inner = col.querySelector('.text-content') || col;
      const parts = [];
      const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) parts.push(heading);
      inner.querySelectorAll('p').forEach((p) => {
        if (p.textContent.trim().length > 0 || p.querySelector('img, a')) parts.push(p);
      });
      inner.querySelectorAll('a').forEach((a) => {
        if (!parts.some((node) => node.contains && node.contains(a))) parts.push(a);
      });
      return parts.length ? parts : '';
    });

    // Ensure exactly 2 columns per row (pad if needed).
    while (rowCells.length < 2) rowCells.push('');
    const finalRow = rowCells.slice(0, 2);

    // Skip rows where neither cell has real content (avoids emitting empty
    // blocks for grids matched by the union selector that contain no usable
    // text/image content).
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
