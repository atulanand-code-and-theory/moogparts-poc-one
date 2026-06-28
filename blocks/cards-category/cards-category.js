import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* build a ul/li structure from the authored rows */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture')) cell.className = 'cards-category-card-image';
      else cell.className = 'cards-category-card-body';
    });
    ul.append(li);
  });

  /* optimize images */
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
