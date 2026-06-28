Let me review the current state of the migrated content and infrastructure before drafting a plan.Let me check the import infrastructure that produces these content files.Let me check the migration-work validation dirs to understand how nav and footer were originally produced.I have enough context on the content files and import infrastructure. One thing affects how I structure the work: nav and footer were built by different tooling than the homepage index. Let me confirm scope.# Homepage Content Re-Fetch & Update Plan

Re-fetch the live MOOG Parts homepage from moogparts.com and regenerate the migrated content for **index**, **nav**, and **footer**, using the existing import infrastructure. Content-only refresh (links, text, structure) — block code and styling stay as-is, except a targeted parser fix to capture the lead hero's missing H1.

> Execution requires **Execute mode**. This artifact is the plan only; switch to Execute mode to run it.

## Scope & Approach

- **Index (homepage):** Re-run the bundled homepage importer against `https://www.moogparts.com/` to regenerate `content/index.plain.html`. Includes a parser fix so the lead hero headline ("Problem Solver Technologies") is no longer blank.
- **Nav:** Re-scrape and regenerate `content/nav.plain.html` content (link tree, structure) only. No changes to header block code or styling.
- **Footer:** Re-scrape and regenerate `content/footer.plain.html` content (link columns, legal links, logos) only. No changes to footer block code or styling.
- **Content generation rule:** All `content/*.html` files are produced **only** via the project's bundled import script + the import skill's bulk-import runner. No hand-editing of content files.

## Known Issue to Address

- **Lead hero H1 blank:** `content/index.plain.html` line ~1 has an empty `<h1></h1>`. The original renders "PROBLEM SOLVER TECHNOLOGIES". Root cause is in `tools/importer/parsers/hero-overlay.js` (or upstream cleanup) dropping the headline for the first hero instance. Fix the parser, re-bundle, then re-import.

## Steps

1. **Confirm import infrastructure is intact** — verify `tools/importer/import-homepage.js`, parsers, transformers, `urls-homepage.txt`, and the bundle exist and reference the right URL (already confirmed during planning).
2. **Diagnose the hero H1 gap** — fetch the live homepage's first `.header-hero` markup, identify where the headline lives, and confirm why `hero-overlay.js` parser isn't capturing it.
3. **Fix `tools/importer/parsers/hero-overlay.js`** so the first hero instance's headline text is extracted into the H1.
4. **Re-bundle the importer** — regenerate `tools/importer/import-homepage.bundle.js` from `import-homepage.js` so the parser fix is included.
5. **Re-import the homepage (index)** — run the bulk import against `https://www.moogparts.com/` to regenerate `content/index.plain.html`. Verify the hero H1 is now populated.
6. **Re-fetch & regenerate nav content** — re-scrape the live site's navigation and regenerate `content/nav.plain.html` (content only).
7. **Re-fetch & regenerate footer content** — re-scrape the live site's footer and regenerate `content/footer.plain.html` (content only).
8. **Verify in preview** — load the homepage at the local preview root, confirm index/nav/footer render with refreshed content, the hero H1 shows, and no content was lost vs. the original.
9. **Lint** — run `npm run lint` to confirm any parser/JS changes pass.

## Checklist

- [ ] Confirm import infrastructure (importer, parsers, transformers, bundle, urls) is present and correct
- [ ] Diagnose why the lead hero H1 imports blank (inspect live `.header-hero` markup vs. `hero-overlay.js`)
- [ ] Fix `tools/importer/parsers/hero-overlay.js` to capture the lead hero headline
- [ ] Re-bundle `import-homepage.bundle.js` with the parser fix
- [ ] Re-import homepage → regenerate `content/index.plain.html`; verify hero H1 populated
- [ ] Re-fetch & regenerate nav content → `content/nav.plain.html` (content only)
- [ ] Re-fetch & regenerate footer content → `content/footer.plain.html` (content only)
- [ ] Verify index, nav, and footer render correctly in the local preview vs. original
- [ ] Run `npm run lint` and resolve any issues

## Out of Scope

- No changes to header/footer block JavaScript or CSS (content refresh only)
- No global design-token / brand styling migration
- No styling changes to other homepage blocks (widget, columns-split, cards-article, cards-category)
