/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-overlay. Base: hero.
 * Sources:
 *   - https://www.moogparts.com/             (.header-hero .header-hero-container) — overlay banners
 *   - https://www.moogparts.com/technologies.html (.header-hero) — VIDEO hero (Play btn, H1, "Find my part" CTA)
 *   - https://www.moogparts.com/parts.html   (.header-foreground) — foreground photo banner (H1 + subtitle, NO CTA)
 *   - technical-landing pages (.header-simple) — a plain title header: just an
 *     H1 and sometimes an intro `<p>`, NO background photo and NO CTA. Emits a
 *     minimal hero (heading + optional paragraph, no image row). Missing
 *     background image / missing CTA are handled gracefully by the shared logic.
 * Generated: 2026-06-27. Extended: 2026-06-28 (parts/technologies support;
 *   technical-landing `.header-simple` title-only hero).
 *
 * Hero library convention: 1 column, up to 3 rows.
 *   Row 1: block name
 *   Row 2: background image (optional)
 *   Row 3: title (heading), subheading/body text, CTA(s) — all in one cell
 *
 * Cross-instance variation handled:
 *  - Homepage overlay: background in `.header-hero-background`, copy in
 *    `.header-hero-content`.
 *  - technologies.html video hero: same `.header-hero-*` structure, but the
 *    content area carries a `<button class="video">` Play control (UI chrome,
 *    NOT authored content — stripped) plus an H1 and an `a.button-main` CTA.
 *  - parts.html `.header-foreground`: background `<img>` sits directly under a
 *    `.has-bg` wrapper; copy lives in `.header-content` (H1 with nested brand
 *    spans + a subtitle `<p>`); there is NO CTA. A duplicate mobile foreground
 *    image (`.foreground-image-mobile` / `.header-foreground-image`) is product
 *    art, not the hero background — excluded from the background row.
 *  - Headings may contain inline `<span>`/`<sup>` markup (e.g. "MOOG® parts");
 *    these are preserved.
 */

// Normalize text for emptiness checks. The source site ships a trim()
// polyfill that does NOT strip non-breaking spaces ( ), so an
// `<h1>&nbsp;</h1>` placeholder would otherwise read as non-empty. Strip
// regular whitespace plus nbsp / zero-width characters explicitly.
const normalizeText = (s) => (s || '').replace(/[\s ​‌‍﻿]+/g, '');
const hasText = (el) => normalizeText(el.textContent).length > 0;

export default function parse(element, { document }) {
  // --- Background image (optional) ---
  // Order of preference matches the three known layouts:
  //  1. `.header-hero-background` (homepage / technologies hero)
  //  2. the `.has-bg` wrapper's direct <img> (parts.html foreground banner)
  //  3. any generic [class*="background"] container
  const bgContainer = element.querySelector('.header-hero-background')
    || element.querySelector('[class*="background"]')
    || element.querySelector(':scope > .has-bg, :scope > div > .has-bg');
  // A real background <img> must NOT be a lazy-load placeholder (the source
  // ships `0.gif` / `.cq-image-placeholder` until hydration) and must NOT be
  // the foreground product art (which lives in `.foreground-image-mobile` /
  // `.header-foreground-image`).
  const isUsableBgImg = (img) => (
    img
    && !img.closest('.foreground-image-mobile, .header-foreground-image')
    && !img.classList.contains('cq-image-placeholder')
    && !/\/0\.gif(\?|$)/i.test(img.getAttribute('src') || '')
  );

  let bgImage = null;
  if (bgContainer) {
    // For `.has-bg` (parts), the banner background is its DIRECT child <img>
    // when present; a deeper <img> belongs to the mobile foreground product
    // art, so prefer a usable direct-child image, then a usable descendant.
    const directImg = bgContainer.querySelector(':scope > img');
    if (isUsableBgImg(directImg)) {
      bgImage = directImg;
    } else {
      const descendantImg = Array.from(bgContainer.querySelectorAll('img'))
        .find((img) => isUsableBgImg(img));
      if (descendantImg) bgImage = descendantImg;
    }
    if (!bgImage) {
      const pic = bgContainer.querySelector('picture');
      if (pic && !pic.closest('.foreground-image-mobile, .header-foreground-image')) {
        bgImage = pic;
      }
    }
    // CSS background-image fallback -> synthesize an <img>. On the live parts
    // pages `.has-bg` carries the banner as an inline `background-image: url()`
    // (the only <img>s are foreground product placeholders, excluded above), so
    // this is the primary background source there. Keep the raw URL from the
    // inline style (absolute or root-relative); the importer resolves relative
    // paths against the page URL downstream. Skip CSS gradients / no-url styles.
    if (!bgImage) {
      const style = bgContainer.getAttribute('style') || '';
      const m = style.match(/background(?:-image)?\s*:\s*[^;]*url\((['"]?)(.*?)\1\)/i);
      if (m && m[2]) {
        const img = document.createElement('img');
        img.setAttribute('src', m[2]);
        bgImage = img;
      }
    }
  }

  // --- Content area ---
  // Homepage/technologies use `.header-hero-content`; parts uses
  // `.header-content`. Fall back to the element itself.
  const contentRoot = element.querySelector('.header-hero-content, .header-hero-content-container, .header-content')
    || element;

  // Primary heading — first heading that actually has text. Preserve inline
  // markup (spans/sup) by referencing the original node.
  const heading = Array.from(contentRoot.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .find((h) => hasText(h)) || null;

  // Subheading + body paragraphs (only those with text or media). Exclude
  // paragraphs that live inside the mobile foreground image wrapper.
  const paragraphs = Array.from(contentRoot.querySelectorAll('p'))
    .filter((p) => !p.closest('.foreground-image-mobile, .header-foreground-image'))
    .filter((p) => hasText(p) || p.querySelector('img, picture, a'));

  // CTA link(s). The `<button class="video">` Play control is widget UI chrome,
  // not an authored CTA, and carries no href — the anchor selectors below skip
  // it. parts.html has no CTA at all (handled gracefully).
  const ctaLinks = Array.from(contentRoot.querySelectorAll('a.button-main, a[class*="button"], .cta-margin-header a, a[href]'))
    .filter((a) => !a.closest('.foreground-image-mobile, .header-foreground-image'))
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
