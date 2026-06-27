/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: moogparts site-wide cleanup.
 *
 * Removes non-authorable site chrome and third-party widgets from the
 * MOOG Parts (AEM Classic) homepage so the import contains only page-level
 * authorable content.
 *
 * All selectors below were verified against migration-work/cleaned.html:
 *   - .skip-navigation              (line 5)   skip link
 *   - .body-frame-side-content      (line 7)   off-canvas mobile nav drawer (nav.mobile-nav-items)
 *   - header.global-header          (line 411) global/site header + nav, closes before #page-content (877)
 *   - nav.page-site-nav-container   (line 629) site nav (nested inside header; removed defensively)
 *   - .footer.section / footer.page-footer-container (lines 1238/1239) footer sitemap/legal/social
 *   - #onetrust-consent-sdk         (line 1457) OneTrust cookie consent modal + banner
 *   - #rufous-sandbox               (line 1703) Twitter analytics iframe
 *
 * Authorable content preserved: #page-content (hero/finder/bulletins/ledes/tiles)
 * and .social-feed .mailing-list (section 7 mailing-list CTA, line 1229).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

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
