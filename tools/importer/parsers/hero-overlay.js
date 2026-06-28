/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-overlay. Base: hero.
 * Source: https://www.moogparts.com/ (.header-hero .header-hero-container)
 * Generated: 2026-06-27
 *
 * Hero library convention: 1 column, 3 rows.
 *   Row 1: block name
 *   Row 2: background image (optional)
 *   Row 3: title (heading), subheading, body text, CTA (all in one cell)
 *
 * Cross-instance variation handled:
 *  - Instance 1 (Problem Solver Technologies) uses an H1; some instances have
 *    an empty heading element — skip headings with no text.
 *  - Background image may be an <img>, inside a <picture>, or set as a CSS
 *    background-image on .header-hero-background.
 */
// Normalize text for emptiness checks. The source site ships a trim()
// polyfill that does NOT strip non-breaking spaces ( ), so an
// `<h1>&nbsp;</h1>` placeholder would otherwise read as non-empty. Strip
// regular whitespace plus nbsp / zero-width characters explicitly.
const normalizeText = (s) => (s || '').replace(/[\s ​‌‍﻿]+/g, '');
const hasText = (el) => normalizeText(el.textContent).length > 0;

export default function parse(element, { document, url }) {
  // --- Background image (optional) ---
  const bgContainer = element.querySelector('.header-hero-background, [class*="background"]');
  let bgImage = null;
  if (bgContainer) {
    bgImage = bgContainer.querySelector('img');
    if (!bgImage) {
      const pic = bgContainer.querySelector('picture');
      if (pic) bgImage = pic;
    }
    // CSS background-image fallback -> synthesize an <img>
    if (!bgImage) {
      const style = bgContainer.getAttribute('style') || '';
      const m = style.match(/url\((['"]?)(.*?)\1\)/i);
      if (m && m[2]) {
        const img = document.createElement('img');
        img.src = new URL(m[2], url).href;
        bgImage = img;
      }
    }
  }

  // --- Content area ---
  const contentRoot = element.querySelector('.header-hero-content, .header-hero-content-container')
    || element;

  // Primary heading — first heading that actually has text.
  const heading = Array.from(contentRoot.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .find((h) => hasText(h)) || null;

  // Subheading + body paragraphs (only those with text or media)
  const paragraphs = Array.from(contentRoot.querySelectorAll('p'))
    .filter((p) => hasText(p) || p.querySelector('img, picture, a'));

  // CTA link(s)
  const ctaLinks = Array.from(contentRoot.querySelectorAll('a.button-main, a[class*="button"], .cta-margin-header a, a'))
    .filter((a, i, arr) => arr.indexOf(a) === i)
    .filter((a) => hasText(a) || a.querySelector('img, picture'));

  // Empty-block guard
  if (!heading && paragraphs.length === 0 && ctaLinks.length === 0 && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (only if present)
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: single cell holding heading + paragraphs + CTAs
  const contentCell = [];
  if (heading) contentCell.push(heading);
  paragraphs.forEach((p) => contentCell.push(p));
  ctaLinks.forEach((a) => {
    // Avoid duplicating a CTA already nested inside a paragraph we added
    if (!paragraphs.some((p) => p.contains(a))) contentCell.push(a);
  });
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-overlay', cells });
  element.replaceWith(block);
}
