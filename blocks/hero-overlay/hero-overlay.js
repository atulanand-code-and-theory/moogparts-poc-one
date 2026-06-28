export default function decorate(block) {
  const rows = [...block.children];

  // The first row is expected to hold the background image, but the minimal
  // "header-simple" variant has no image and a single content row only.
  const firstRow = rows[0];
  const img = firstRow ? firstRow.querySelector('img') : null;
  const picture = firstRow ? firstRow.querySelector('picture') : null;
  const hasImage = !!(img || picture);

  let imageRow = null;
  let contentRow = null;

  if (hasImage) {
    // Promote the image cell into a dedicated background layer.
    imageRow = firstRow;
    imageRow.classList.add('hero-overlay-bg');
    // Unwrap the image from any <p> EDS added so it can fill the layer.
    const wrapper = (picture || img).closest('p');
    if (wrapper && wrapper.children.length === 1) {
      wrapper.replaceWith(picture || img);
    }
    // Remaining rows hold the textual content.
    contentRow = rows[1] || rows.find((r) => r !== imageRow);
  } else {
    // No background image (minimal title header): the first row IS the content.
    block.classList.add('no-image');
    contentRow = firstRow;
  }

  if (contentRow) {
    contentRow.classList.add('hero-overlay-content');
  }

  // Remove empty headings (authored as placeholders).
  block.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (!h.textContent.trim()) h.remove();
  });

  // Decide alignment variant:
  // centered layout when the headline is an <h2> (e.g. "Excellence Never Quits"),
  // otherwise default to the bottom-left layout used by the lead hero.
  const heading = contentRow ? contentRow.querySelector('h1, h2, h3, h4, h5, h6') : null;
  if (heading && heading.tagName === 'H2') {
    block.classList.add('centered');
  }

  // Mark the CTA link so it can be styled as a solid button.
  const cta = (contentRow || block).querySelector('a');
  if (cta) {
    cta.classList.add('hero-overlay-cta');
    const p = cta.closest('p');
    if (p) p.classList.add('hero-overlay-cta-wrapper');
  }
}
