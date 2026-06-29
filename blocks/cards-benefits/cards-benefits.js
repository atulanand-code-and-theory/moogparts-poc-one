/* cards-benefits — MOOG "Quick-Look Benefits" text-only grid.
   Source shape (.product-benefits .columns-4): a repeating set of small items,
   each a short bold label (Innovative / Durable / Safer / Easier) above a
   one-line description. No images, no links — a plain text feature grid.
   Each authored ROW = one benefit. Cells become <li> with a label + body. */

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      div.className = 'cards-benefits-card-body';
    });

    // The first line is the benefit label; the rest is its description.
    const body = li.querySelector('.cards-benefits-card-body');
    if (body) {
      const label = body.querySelector('h1, h2, h3, h4, h5, h6')
        || body.querySelector('p');
      if (label) label.classList.add('cards-benefits-label');
    }

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
