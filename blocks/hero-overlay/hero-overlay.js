export default function decorate(block) {
  const rows = [...block.children];

  // The first row is expected to hold the background image.
  const imageRow = rows[0];
  const img = imageRow ? imageRow.querySelector('img') : null;
  const picture = imageRow ? imageRow.querySelector('picture') : null;

  if (img || picture) {
    // Promote the image cell into a dedicated background layer.
    imageRow.classList.add('hero-overlay-bg');
    // Unwrap the image from any <p> EDS added so it can fill the layer.
    const wrapper = (picture || img).closest('p');
    if (wrapper && wrapper.children.length === 1) {
      wrapper.replaceWith(picture || img);
    }
  } else {
    block.classList.add('no-image');
  }

  // The remaining rows hold the textual content.
  const contentRow = rows[1] || rows.find((r) => r !== imageRow);
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
