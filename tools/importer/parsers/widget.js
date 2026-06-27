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
 * widget source link. (The "Find My Part" heading + intro paragraph are
 * authored separately as default content, per the authoring analysis.)
 */
export default function parse(element, { document }) {
  // Derive the widget name from the source container class
  // `driv-part-finder-main` -> the part finder widget.
  const widgetName = 'part-finder';

  // The widget block decorator reads `widget.querySelector('a[href]')` and
  // parses the pathname to resolve `/widgets/<path>/<name>.{html,css,js}`.
  const link = document.createElement('a');
  link.href = `/widgets/${widgetName}.html`;
  link.textContent = `/widgets/${widgetName}.html`;

  // 1-column block: one row, one cell holding the link.
  const cells = [[link]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'widget', cells });
  element.replaceWith(block);
}
