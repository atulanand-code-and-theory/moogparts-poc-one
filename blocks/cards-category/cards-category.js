import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* build a ul/li structure from the authored rows */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (cell.querySelector('picture, img')) cell.className = 'cards-category-card-image';
      else cell.className = 'cards-category-card-body';
    });
    ul.append(li);
  });

  /* optimize images */
  ul.querySelectorAll('.cards-category-card-image img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    const picture = img.closest('picture');
    if (picture) picture.replaceWith(optimizedPic);
    else img.replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
