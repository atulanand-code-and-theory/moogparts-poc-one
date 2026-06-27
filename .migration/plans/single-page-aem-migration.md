# Single Page Migration Plan — moogparts.com Homepage

## Overview
Migrate the homepage at `https://www.moogparts.com/` to AEM Edge Delivery Services (EDS) from a fresh start. Scope includes the main page body **plus** the site navigation header and footer. The workflow analyzes the source page, generates import infrastructure, imports content, instruments nav/footer, and visually validates against the original.

## Source
- **Page URL:** `https://www.moogparts.com/`
- **Start state:** Fresh — no prior analysis
- **Nav/Footer:** Included in this effort

## Prerequisites
- [ ] Confirm project type (doc / da / xwalk) and identify the project's block library endpoint

## Checklist

### 1. Project Context
- [ ] Determine project type and block library endpoint
- [ ] Catalog available EDS blocks that can be reused

### 2. Page Analysis
- [ ] Scrape the homepage (capture metadata, cleaned HTML, screenshots, local images)
- [ ] Identify content structure: sections, sequences, and authoring decisions
- [ ] Catalog block variants needed (reuse existing blocks where ≥80% similar; create new variants only when required)

### 3. Import Infrastructure
- [ ] Create `page-templates.json` with the homepage template and block mappings
- [ ] Generate block parsers in `tools/importer/parsers/`
- [ ] Generate page transformers (cleanup, sections, media) in `tools/importer/transformers/`

### 4. Block Development (only if new variants are required)
- [ ] Implement block JS + CSS for any new variants
- [ ] Migrate visual design / styles from the source to match the original

### 5. Content Import
- [ ] Bundle the import script
- [ ] Run the bulk importer against the homepage URL
- [ ] Verify the generated content document is produced in the content directory

### 6. Navigation Header
- [ ] Capture nav screenshots and map structure (including any megamenu / hover behavior)
- [ ] Instrument the EDS navigation header (desktop + mobile)
- [ ] Validate nav structure and appearance against the original

### 7. Footer
- [ ] Detect footer sections and map content/links
- [ ] Build the EDS footer (desktop + mobile)
- [ ] Validate footer structure and appearance against the original

### 8. Visual Validation
- [ ] Preview the migrated page and compare against the original
- [ ] Critique and fix styling/structure discrepancies (iterate as needed)

### 9. Wrap-up
- [ ] Confirm the page, header, and footer render correctly in preview
- [ ] Summarize results and note any follow-ups (e.g., additional pages, content authoring)

## Notes
- Execution requires **Execute mode** — this is a plan only.
- Header and footer migration depend on the main page being migrated first, so they run after the content import step.
