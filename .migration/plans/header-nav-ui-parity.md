# Header Navigation Pages — UI Parity Plan

Bring every page reachable from the site header (nav) to visual parity with the live moogparts.com site. Audit each nav destination's published EDS page against its source, log discrepancies, fix at the right layer (block CSS, parser, transformer, or footer/global), re-import affected pages, and re-verify.

> Execution requires **Execute mode** — this artifact is the plan only. No files are modified while in plan mode.

## Nav destinations in scope

From the header (top utility bar + main nav + Find My Part), grouped by the template that renders them:

| Nav item | URL | Template |
|----------|-----|----------|
| Parts (landing) | `/parts` | parts-landing |
| Steering / Suspension / Driveline / Wheel End | `/parts/{cat}` | parts-category |
| Sub-categories (universal-joints, alignment-parts, vehicle-bushings, hub-assemblies) | `/parts/{cat}/{sub}` | parts-category |
| Product leaf pages (idler-arms, ball-joints, …) | `/parts/{cat}/{product}` | parts-product |
| Support (landing) | `/technical` | technical-landing |
| Training | `/technical/training` | technical-landing |
| Know Your Parts | `/technical/training/know-your-parts` | content-article |
| Technical Content (bulletins) | `/technical/bulletins` | technical-landing |
| Problem Solver / Did You Know bulletins | `/technical/bulletins/{x}` | technical-tool |
| Tech Tips | `/technical/bulletins/tech-tips` | tech-tips |
| Installation Instructions | `/technical/bulletins/installation-instructions` | technical-tool |
| Diagnostic Center | `/technical/diagnostic-center` | technical-landing |
| Car/Crossover, Light Truck/SUV | `/technical/diagnostic-center/{x}` | technical-tool |
| Independent Testing Results | `/technical/something-big-moog-app` | content-article |
| Technologies | `/technologies` | technologies |
| Installation Guide Search | `/installation-guide-search` | standalone |
| Find My Part | `/find-my-part` | standalone |
| Light Commercial Vehicle | `/light-commercial-vehicle` | standalone |
| Chassis System 101 (utility bar) | `/parts-matter` | parts-matter-index |

One representative per **unique template** is audited deeply (a fix to a template/block propagates to all its pages); leaf variants get a lighter spot-check.

## Method (per representative page)

1. Open the published EDS page: `https://main--moogparts-poc-one--atulanand-code-and-theory.aem.live{path}`.
2. Open the source: `https://www.moogparts.com{path}.html`.
3. Compare section-by-section: hero, content blocks, widgets, headings, images, CTAs, section order/styling, footer band.
4. Classify each discrepancy → fix layer:
   - **Global/section** (heading style, section bg) → `styles/styles.css`
   - **Footer/site-wide chrome** → `blocks/footer/*`
   - **Block styling** → `blocks/{block}/*` (via block-design-expert if non-trivial)
   - **Content/structure** (missing heading, image, dropped element) → `tools/importer/parsers/{block}.js` or `transformers/moogparts-cleanup.js`, then re-import the affected page(s)
5. Re-import only the pages whose content changed; re-verify rendering.

## Known carry-over items to confirm first

These were fixed in repo but not yet confirmed live across all nav pages — verify they apply everywhere:
- Footer "Join our MOOG Mailing List" band (footer block) — should now appear on every nav page.
- `cards-timeline` block + CSS-background image extraction (about page; not a nav page but shares standalone template).
- columns-split `buildTextCell` all-headings fix (affects parts-matter featured + any tout with eyebrow+title).

## Checklist

- [ ] Confirm dev server running and capture the published base URL + source base URL
- [ ] Re-confirm footer mailing-list band renders on a sample nav page (technical, parts, technologies)
- [ ] **parts-landing** (`/parts`): audit hero + category tiles + ZIP locator vs source; fix discrepancies
- [ ] **parts-category** (`/parts/steering`): audit foreground hero image, product-card grid (image+title+desc+View Product), YMM finder; fix
- [ ] **parts-category sub** (`/parts/suspension/alignment-parts`): spot-check renders same as steering
- [ ] **parts-product** (`/parts/steering/idler-arms`): audit hero, product-feature row (image+bullets+CTAs), Quick-Look Benefits grid, YMM finder; fix
- [ ] **technical-landing** (`/technical`): audit hero + tout feature rows + section headings; fix
- [ ] **technical-landing** (`/technical/training`, `/technical/bulletins`, `/technical/diagnostic-center`): spot-check the header-simple/header-hero + tout variants
- [ ] **technical-tool** (`/technical/bulletins/did-you-know-bulletins`): audit search-files widget frame + cross-sell cards; fix
- [ ] **technical-tool** (`/technical/diagnostic-center/car-crossover`, `/installation-guide-search`): confirm diagnostic-center / documents-autocomplete widget frames render
- [ ] **tech-tips** (`/technical/bulletins/tech-tips`): audit hero + article card grid + View More; fix
- [ ] **content-article** (`/technical/something-big-moog-app`, `/technical/training/know-your-parts`): audit headings, body images, video embed, where-to-buy locator; fix
- [ ] **technologies** (`/technologies`): audit video hero, Technology Videos rows, Technology Articles grid, Find My Part finder; fix
- [ ] **standalone** (`/find-my-part`, `/light-commercial-vehicle`): audit hero/widget/promo sections; fix
- [ ] **parts-matter-index** (`/parts-matter`): verify featured-article title (columns-split fix), article grid images, finders; fix any remainder
- [ ] Apply fixes at correct layer (global CSS / footer / block CSS / parser / transformer)
- [ ] Re-import only the content pages whose parser/transformer output changed
- [ ] Re-verify each fixed page renders to parity (rendered DOM + computed styles)
- [ ] Run `npm run lint` (JS + CSS) — must pass clean
- [ ] Summarize discrepancies found and fixes applied per template

## Out of scope / noted limitations

- **Runtime widgets** (part-finder, where-to-buy locator, diagnostic tool, bulletin search, doc autocomplete) render as styled static stand-ins; wiring to live backends is integration work, not UI parity.
- **Legacy image URLs**: many images point at `www.moogparts.com` (resolve 200); converting to DA-hosted assets is a publish/asset-upload decision, not addressed here.
- **Self-hosted fonts** render via fallback only on environments where the licensed fonts aren't served; correct in production.
- Fixes land in the repo; they appear on published URLs only after the updated content docs + block code are deployed.
