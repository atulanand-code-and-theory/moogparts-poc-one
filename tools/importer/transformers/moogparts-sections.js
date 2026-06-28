/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: moogparts section boundaries + section metadata.
 *
 * Driven entirely by payload.template.sections (from page-templates.json), so
 * it is template-agnostic and supports every moogparts template with no
 * per-template branching. Section selectors were verified against the captured
 * DOM of each migrated page:
 *
 * homepage (7 sections, migration-work was the homepage when authored):
 *   1 .header-hero:nth-of-type(1) .header-hero-container          (style: null)
 *   2 .driv-part-finder-main                                      (style: light)
 *   3 .header-hero:nth-of-type(2) .header-hero-container          (style: null)
 *   4 #page-content .responsivegrid .aem-Grid--12 > .responsivegrid:has(.text-content) (style: blue)
 *   5 .ledes .ledes-container                                     (style: grey)
 *   6 .hover-tout                                                 (style: null)
 *   7 .social-feed .mailing-list                                  (style: yellow)
 *
 * parts-landing (3 sections, verified in migration-work/_parts-landing/cleaned.html):
 *   1 .header-foreground                                          (style: null)
 *   2 .hover-tout                                                 (style: null)
 *   3 .where-to-buy-link                                          (style: null)
 *   -> 2 <hr>, 0 Section Metadata (all styles null)
 *
 * technologies (4 sections, verified in migration-work/cleaned.html):
 *   1 .header-hero                                                (style: null)
 *   2 .tout                                                       (style: null)
 *   3 .ledes                                                      (style: grey)
 *   4 .driv-part-finder-main                                      (style: light)
 *   -> 3 <hr>, 2 Section Metadata (grey + light)
 *
 * Section selectors may be either a single CSS string or an ARRAY of candidate
 * strings (the newer templates use arrays where one of several markup variants
 * may appear, e.g. technical-landing section-1 [".header-hero", ".header-simple"]
 * and technical-tool section-1 [".search-files", ".diagnostic-center",
 * ".documents-autocomplete"]). resolveSelector() handles both: for an array it
 * returns the first matching element, so per-page markup variants resolve to the
 * correct section anchor without per-template branching.
 *
 * For each section (processed in reverse document order to keep insertion
 * points stable):
 *   - if section.style is set, insert a "Section Metadata" block after the
 *     section's first matched element.
 *   - if the section is not the first, insert an <hr> before it.
 *
 * Runs in beforeTransform: block parsers replaceWith() the matched section
 * elements between the hooks, so section selectors no longer resolve in
 * afterTransform. Inserting the <hr> / Section Metadata siblings before
 * parsing keeps them in place after the parser swaps the element.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Resolve a section's selector to its first matched element. Accepts either a
 * single CSS selector string or an array of candidate selectors (returns the
 * first one that matches). Returns null when nothing matches or the selector is
 * absent/invalid, so callers can skip the section safely.
 */
function resolveSelector(root, selector) {
  if (!selector) return null;
  const candidates = Array.isArray(selector) ? selector : [selector];
  for (let c = 0; c < candidates.length; c += 1) {
    const sel = candidates[c];
    if (typeof sel === 'string' && sel) {
      try {
        const found = root.querySelector(sel);
        if (found) return found;
      } catch (e) {
        // invalid selector string - skip this candidate
      }
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const sections = payload && payload.template && payload.template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;

  const doc = element.ownerDocument;

  // Resolve each section to its first matched DOM element up front, so that
  // DOM mutations during insertion don't shift later lookups.
  const resolved = sections.map((section) => ({
    section,
    el: resolveSelector(element, section.selector),
  }));

  // Process in reverse so inserted <hr> / metadata blocks don't disturb the
  // positions of sections we haven't handled yet.
  for (let i = resolved.length - 1; i >= 0; i -= 1) {
    const { section, el } = resolved[i];
    if (!el) continue;

    // Section Metadata block (only when a style is defined for the section).
    if (section.style) {
      const block = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      if (el.parentNode) {
        el.parentNode.insertBefore(block, el.nextSibling);
      }
    }

    // Section break before every section except the first.
    if (i > 0) {
      const hr = doc.createElement('hr');
      if (el.parentNode) {
        el.parentNode.insertBefore(hr, el);
      }
    }
  }
}
