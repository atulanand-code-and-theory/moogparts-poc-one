/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: moogparts site-wide cleanup.
 *
 * Removes non-authorable site chrome and third-party widgets from MOOG Parts
 * (AEM Classic) pages so the import contains only page-level authorable
 * content. Selectors are shared across the homepage, parts-landing, and
 * technologies templates (identical global chrome on all three).
 *
 * Selectors verified against the captured DOM of all migrated pages
 * (migration-work/cleaned.html = technologies; migration-work/_parts-landing/
 * cleaned.html = parts-landing; homepage previously verified):
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
      // Empty AEM embed placeholders left between hero blocks (no authorable content)
      '.embed-source',
      // Third-party / safe-to-strip elements
      '#rufous-sandbox',
      'iframe',
      'script',
      'noscript',
      'style',
      'link',
    ]);

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
