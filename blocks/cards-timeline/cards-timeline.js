import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates the "Our History" timeline block. Each source row becomes one
 * timeline entry: an optional image cell and a text cell that holds the year
 * (h3), entry title (h4) and description. Entries alternate left/right of a
 * central spine; the year label straddles the spine.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    li.className = `cards-timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;

    // Flatten the row's cells into the item, classifying media vs text.
    const cells = [...row.children];
    let imageCell = null;
    let bodyCell = null;
    cells.forEach((div) => {
      const hasMedia = div.querySelector('picture, img');
      const hasText = div.querySelector('h1, h2, h3, h4, h5, h6')
        || [...div.querySelectorAll('p')].some((p) => p.textContent.trim().length);
      if (hasMedia && !hasText) {
        div.className = 'cards-timeline-item-image';
        imageCell = div;
      } else if (hasText) {
        div.className = 'cards-timeline-item-body';
        bodyCell = div;
      }
    });

    // Pull the year heading out of the body so it can be positioned on the spine.
    let yearEl = null;
    if (bodyCell) {
      yearEl = bodyCell.querySelector('h3');
      if (yearEl) {
        yearEl.classList.add('cards-timeline-year');
        li.append(yearEl);
      }
    }
    if (imageCell) li.append(imageCell);
    if (bodyCell) li.append(bodyCell);

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    img.closest('picture').replaceWith(optimized);
  });

  block.textContent = '';
  block.append(ul);
}
