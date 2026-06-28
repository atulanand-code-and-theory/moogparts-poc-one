/* eslint-disable */
/* global WebImporter */
/**
 * Parser for widget (local special block).
 * Source: https://www.moogparts.com/ (.driv-part-finder-main)
 * Generated: 2026-06-27
 *
 * The local `blocks/widget` block embeds an interactive widget/app and
 * self-resolves its sub-name + CSS/JS from a single <a href> that points
 * to an asset under `/widgets/`. The source DOM here is the live
 * "Find My Part" part-finder app (class `driv-part-finder-main`), which has
 * no embeddable href of its own, so the parser synthesizes the canonical
 * widget reference link.
 *
 * Block convention: 1 column, 1 content row whose single cell contains the
 * widget source link.
 *
 * The "Find My Part" heading + intro paragraph live INSIDE the source
 * `.driv-part-finder-main` container (before the search panels). They are
 * authorable section content, so we lift them out as default content placed
 * before the widget block — otherwise they are lost when the container is
 * replaced. The two "Search by …" sub-panel headings are part of the runtime
 * widget UI and render when the widget loads, so they are NOT authored here.
 */
export default function parse(element, { document }) {
  // Derive the widget name from the source container class
  // `driv-part-finder-main` -> the part finder widget.
  const widgetName = 'part-finder';

  // Preserve the section heading + intro paragraph as default content. The
  // finder container is nested (outer wrapper + inner component div), so the
  // h2/intro-p are descendants, not direct children. They appear before the
  // runtime search panels (whose headings are h4), so the first h1-h3 and the
  // first paragraph are the authorable "Find My Part" + intro copy.
  const preserved = [];
  const heading = element.querySelector('h1, h2, h3');
  if (heading && heading.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.trim();
    preserved.push(h2);
  }
  const intro = element.querySelector('p');
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
