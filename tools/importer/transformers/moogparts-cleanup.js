/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: moogparts site-wide cleanup.
 *
 * Removes non-authorable site chrome and third-party widgets from MOOG Parts
 * (AEM Classic) pages so the import contains only page-level authorable
 * content. Selectors are shared across the homepage, parts-landing,
 * technologies, parts-category, and parts-product templates (identical global
 * chrome on all of them).
 *
 * Selectors verified against the captured DOM of all migrated pages
 * (migration-work/cleaned.html = parts-product /parts/steering/idler-arms.html
 * at time of this pass; earlier passes verified technologies, parts-landing and
 * homepage against the same global-chrome selectors below):
 *   - .skip-navigation              skip link
 *   - .body-frame-side-content      off-canvas mobile nav drawer
 *   - .body-frame-global-content / .global-mobile-nav / .region-and-language
 *                                   mobile nav drawer body (region/language selector)
 *   - header.global-header          global/site header + nav (.page-nav lives inside)
 *   - nav.page-site-nav-container   site nav (nested inside header; removed defensively)
 *   - .footer.section / footer.page-footer-container   footer sitemap/legal/social
 *   - #onetrust-consent-sdk         OneTrust cookie consent modal + banner
 *   - #rufous-sandbox               Twitter analytics iframe
 *   - .embed-source                 empty AEM embed placeholders between blocks
 *                                   (incl. the leading empty placeholder on tech-tips)
 *   - .block-separator              presentational divider rules between touts
 *                                   (technical-landing); not authorable content
 *
 * Parts-specific chrome (parts-category / parts-product), verified against
 * migration-work/cleaned.html = /parts/steering/idler-arms.html:
 *   - .buy-online-toolbox           retailer "Buy Now" popup nested in the
 *                                   product-feature CTAs (line 954). JS-driven
 *                                   overlay of retailer links (Advance Auto,
 *                                   O'Reilly, Pep Boys) toggled by the "Buy Now"
 *                                   button; not authorable. Left in, it leaks the
 *                                   retailer links into the columns-split block.
 *                                   The authorable "Get it Installed" / "Buy in
 *                                   Store" CTA links and the "Buy Now" button
 *                                   text are preserved.
 *   - .random-tip                   "Tech Tips" random-tip teaser widget rendered
 *                                   after the YMM finder (lines 1074-1094). JS-
 *                                   populated (spinner + ng-binding placeholders),
 *                                   not part of any mapped section; leaks a stray
 *                                   "Tech Tips" heading + View Tech Tips button.
 *                                   Also present on parts-category pages.
 *   NOTE: the .ymm-search internal "Loading..." spinners are inside the widget
 *   block placeholder handled by the widget parser, so they are not removed
 *   here. cq-image-placeholder is an AEM class on REAL product images
 *   (authorable) and is deliberately NOT targeted.
 *
 * YouTube video embeds inside .article (content-article / know-your-parts):
 *   The global iframe strip below would silently drop authorable video content.
 *   Before that strip runs, any <iframe> nested inside .article whose src points
 *   at YouTube is converted to an anchor (href = video URL) so the video link
 *   round-trips through the import as preserved content rather than vanishing.
 *   Ad/tracker iframes (outside .article) are still removed.
 *
 * Mailing-list band (.social-feed .mailing-list, "Join our MOOG Mailing List"):
 *   - On the HOMEPAGE this is an authorable section (homepage template
 *     section-7, style "yellow") and MUST be preserved.
 *   - On parts-landing and technologies it is part of the global footer chrome
 *     (nested inside .footer-par, lines 1037-1039 of each page's cleaned.html)
 *     and MUST be removed.
 *   Disambiguation is template-aware: the band is removed only when the
 *   current template does NOT declare a .social-feed/.mailing-list section
 *   (see isMailingListAuthorable below), so the homepage is never affected.
 *
 * Authorable content preserved: #page-content (hero/finder/tiles/ledes/touts).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Returns true when the current template treats the mailing-list band as an
 * authorable section (homepage). Driven by payload.template.sections so the
 * cleanup never removes authorable content. Defaults to false (treat as
 * chrome) when no template/section info is available.
 */
function isMailingListAuthorable(payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!Array.isArray(sections)) return false;
  return sections.some((section) => {
    const sel = (section && section.selector) || '';
    const defaults = (section && section.defaultContent) || [];
    const hasMailingSelector = sel.includes('mailing-list') || sel.includes('social-feed');
    const hasMailingDefault = Array.isArray(defaults)
      && defaults.some((d) => typeof d === 'string'
        && (d.includes('mailing-list') || d.includes('social-feed')));
    return hasMailingSelector || hasMailingDefault;
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Consent modal / overlay can block block-matching; remove before parsing.
    // Verified: <div id="onetrust-consent-sdk"> (cleaned.html line 1457)
    WebImporter.DOMUtils.remove(element, ['#onetrust-consent-sdk']);

    // Preserve authorable YouTube video embeds nested in .article body
    // (content-article / know-your-parts) before the global iframe strip in
    // afterTransform removes them. Convert each YouTube <iframe> to an anchor so
    // the video URL survives the import as a link. Non-article (ad/tracker)
    // iframes are untouched here and removed later. Watch-URL conversion keeps
    // the link author-friendly; if the src is not parseable it is left as-is.
    element.querySelectorAll('.article iframe[src]').forEach((iframe) => {
      const src = iframe.getAttribute('src') || '';
      if (!/(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i.test(src)) return;
      let href = src;
      if (href.startsWith('//')) href = `https:${href}`;
      // youtube.com/embed/<id> -> youtube.com/watch?v=<id>
      const embedMatch = href.match(/\/embed\/([\w-]+)/);
      if (embedMatch) href = `https://www.youtube.com/watch?v=${embedMatch[1]}`;
      const a = element.ownerDocument.createElement('a');
      a.href = href;
      a.textContent = href;
      iframe.replaceWith(a);
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (header, mobile nav drawer, site nav, footer).
    // Verified selectors from cleaned.html (see file header comment).
    WebImporter.DOMUtils.remove(element, [
      '.skip-navigation',
      '.body-frame-side-content',
      // Mobile nav drawer body (region/language selector) - site chrome, not page content
      '.body-frame-global-content',
      '.global-mobile-nav',
      '.region-and-language',
      'header.global-header',
      'nav.page-site-nav-container',
      '.footer.section',
      'footer.page-footer-container',
      // Empty AEM embed placeholders left between hero blocks (no authorable
      // content); also covers the leading empty placeholder on tech-tips.
      '.embed-source',
      // Presentational divider rules between touts (technical-landing) - not
      // authorable content, drop so they don't become stray default content.
      '.block-separator',
      // Parts-specific chrome (parts-category / parts-product), verified in
      // /parts/steering/idler-arms.html cleaned.html:
      //   - retailer "Buy Now" popup nested in product-feature CTAs; leaks
      //     retailer links into the columns-split block (authorable "Get it
      //     Installed" / "Buy in Store" CTAs + "Buy Now" button text kept).
      //   - "Tech Tips" random-tip teaser widget after the YMM finder; JS-
      //     driven, not in any mapped section, leaks a stray heading + button.
      '.buy-online-toolbox',
      '.random-tip',
      // where-to-buy runtime store-locator chrome: the interactive Google Maps
      // canvas (map tiles, zoom controls, {{dealer.*}} ng-repeat infowindow
      // templates) and the filter sidebar are widget runtime UI, not authorable
      // content. The authorable ZIP locator is .where-to-buy-search (mapped to
      // the widget block); these two leak map controls + unhydrated templates.
      '.where-to-buy-map',
      '.where-to-buy-search-filter',
      // Third-party / safe-to-strip elements
      '#rufous-sandbox',
      'iframe',
      'script',
      'noscript',
      'style',
      'link',
      // Marketing tracking pixels (dataxu/w55c) and leaked Google Maps tiles
      // (the real store map is the runtime where-to-buy widget). These are
      // non-content images that otherwise become stray <picture> blocks.
      'img[src*="tags.w55c.net"]',
      'img[src*="maps.googleapis.com"]',
      'img[src*="maps.gstatic.com"]',
    ]);

    // Drop now-empty <picture>/<p> wrappers left behind after removing the
    // tracking-pixel <img> above (avoids stray empty blocks in the output).
    element.querySelectorAll('picture').forEach((pic) => {
      if (!pic.querySelector('img')) {
        const wrap = pic.closest('p') || pic;
        wrap.remove();
      }
    });

    // Strip orphan widget/carousel "loading..." placeholders and unhydrated
    // AngularJS template expressions ({{ ... }}) that leak from runtime widgets
    // (related-stories carousel, store-locator dealer ng-repeat) as text. These
    // are never authorable content.
    element.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6').forEach((el) => {
      if (el.children.length > 0) return;
      const text = (el.textContent || '').trim();
      if (text.toLowerCase() === 'loading...' || /^\{\{[^}]+\}\}$/.test(text)) {
        el.remove();
      }
    });

    // Mailing-list band ("Join our MOOG Mailing List"): on parts-landing and
    // technologies it is footer chrome nested in .footer-par; on the homepage
    // it is authorable section-7. Remove only when the current template does
    // not declare it as an authorable section, so the homepage is unaffected.
    if (!isMailingListAuthorable(payload)) {
      WebImporter.DOMUtils.remove(element, ['.social-feed']);
    }

    // Strip AngularJS / AEM authoring/tracking attributes that are not authorable.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('ng-app');
      el.removeAttribute('ng-controller');
      el.removeAttribute('ng-click');
      el.removeAttribute('ng-if');
      el.removeAttribute('ng-repeat');
      el.removeAttribute('ng-class');
      el.removeAttribute('onclick');
    });
  }
}
