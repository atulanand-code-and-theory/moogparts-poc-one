# MOOG Parts — AEM On-Premise to Edge Delivery Services (EDS) Migration Assessment

> **Report Date:** 27 June 2026  
> **Target Site:** [https://www.moogparts.com/](https://www.moogparts.com/)  
> **Current Platform:** Adobe Experience Manager (AEM) 6.x On-Premise / Managed Services  
> **Target Platform:** AEM Edge Delivery Services (EDS)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Overview](#2-current-architecture-overview)
3. [Page Inventory & URL Taxonomy](#3-page-inventory--url-taxonomy)
4. [Technology Stack Deep Dive](#4-technology-stack-deep-dive)
5. [Component Inventory & Block Mapping](#5-component-inventory--block-mapping)
6. [Third-Party Integrations & Tag Management](#6-third-party-integrations--tag-management)
7. [Internationalization & Locale Coverage](#7-internationalization--locale-coverage)
8. [SEO Audit Findings](#8-seo-audit-findings)
9. [Performance Baseline](#9-performance-baseline)
10. [Migration Complexity Signals](#10-migration-complexity-signals)
11. [Recommended Migration Strategy](#11-recommended-migration-strategy)
12. [Phased Delivery Plan](#12-phased-delivery-plan)
13. [Risk Register](#13-risk-register)
14. [Appendices](#14-appendices)

---



## 1. Executive Summary



### 1.1 What We Found

The **moogparts.com** website is a mid-to-large scale automotive e-commerce and brand presence site built on **Adobe Experience Manager (AEM) 6.x On-Premise** hosted via **Adobe Managed Services**. The site serves as the digital front door for the MOOG automotive aftermarket parts brand (a DRiV/Tenneco portfolio company).

The current implementation presents **significant technical debt and architectural complexity** that will directly impact the EDS migration effort:


| Dimension          | Assessment                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Platform**       | AEM 6.x On-Premise — confirmed via `/etc.clientlibs/`, `_jcr_content` paths, `ContextHub`, `GraniteClientLibraryManager` |
| **Frontend**       | Hybrid **AngularJS 1.x** (`ng-app="fmmp.moog"`) + **Vue.js** — dual legacy SPA frameworks                                |
| **Commerce**       | **Hybris/SAP Commerce** integration backing the Part Finder tool                                                         |
| **Custom Code**    | 100% custom AEM components — **no Core Components** in use                                                               |
| **Multi-Brand**    | Shared AEM instance with other DRiV brands — isolation is required                                                       |
| **Locales**        | 16+ locale variants — only 1 has sitemap coverage                                                                        |
| **Tag Management** | GTM, GA4, Google Ads, Meta Pixel, OneTrust, Floodlight                                                                   |




### 1.2 Key Migration Challenges

1. **🟥 AngularJS SPA (Critical)** — The Part Finder and News pages are client-side rendered by AngularJS 1.x. Cannot be migrated to static ESD documents without API composition, edge worker, or micro-frontend.
2. **🟥 Hybris/SAP Commerce Dependency (Critical)** — The Part Finder tool relies on Hybris APIs for vehicle and part-number search. Largest architectural dependency.
3. **🟧 Custom AEM Components (High)** — Every component is custom-built. Zero reusable Core Components.
4. **🟧 Multi-Tenant AEM Instance (High)** — Content intermingled with other DRiV brands. Clean extraction is nontrivial.
5. **🟧 Mixed SPA Frameworks (High)** — AngularJS 1.x (EOL 2022) and Vue.js coexist. Both must be phased out.
6. **🟨 SEO Defects (Medium)** — Broken hreflang, missing sitemaps for 26 locales, mixed-case slugs.



### 1.3 Recommended Approach

**Phase the migration by page type**, prioritizing high-traffic, low-complexity pages first:


| Phase       | Scope                                             | Effort        | Impact       |
| ----------- | ------------------------------------------------- | ------------- | ------------ |
| **Phase 1** | Utility pages (About, Contact, Privacy, Legal)    | Low           | Low          |
| **Phase 2** | L1/L2 Category pages + Homepage                   | Medium        | High         |
| **Phase 3** | L3 Product Line pages + Technical Hub             | Medium        | High         |
| **Phase 4** | News (AngularJS replacement) + Technologies       | High          | Medium       |
| **Phase 5** | **Find My Part (Hybris)** — replace AngularJS SPA | **Very High** | **Critical** |
| **Phase 6** | Locale rollout (16+ markets) + SEO remediation    | Medium        | High         |


---



## 2. Current Architecture Overview



### 2.1 Infrastructure Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    Adobe Managed Services                       │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │   AEM Author      │    │   AEM Publish    │                  │
│  │  (author-driv-    │───▶│                   │                  │
│  │   prod.adobe-     │    │  AEM Dispatcher   │                  │
│  │   cqms.net)       │    │  (Apache HTTPD)   │                  │
│  └──────────────────┘    └────────┬─────────┘                  │
│                                   ▼                             │
│                          No CDN detected                        │
└────────────────────────────────────────────────────────────────┘
                                ▼
          Browser: AngularJS + Vue.js · GTM · GA4 · OneTrust
                                ▼
                    Hybris/SAP Commerce (API)
```



### 2.2 Hosting & Infrastructure


| Component              | Detail                                          |
| ---------------------- | ----------------------------------------------- |
| **CMS**                | Adobe Experience Manager 6.x On-Premise         |
| **Hosting**            | Adobe Managed Services (AMS)                    |
| **Web Server**         | Apache HTTPD (AEM Dispatcher)                   |
| **CDN**                | Not detected                                    |
| **Author Environment** | `author-driv-prod.adobecqms.net` (multi-tenant) |
| **Device Detection**   | `Vary: User-Agent` header present               |




### 2.3 Content Repository Structure

The AEM content hierarchy follows the pattern:
`/content/loc-na/loc-us/fmmp-moog/en_US/`

Major content sections:

- `parts/{steering,suspension,driveline,wheel-end}/` — Product categories
- `moognews/` — News articles (AngularJS rendered)
- `technical/` — Support hub, bulletins, diagnostic center
- `legal/` — Privacy policy, terms, warranty
- `find-my-part/` — Part Finder tool (AngularJS + Hybris)

**Key insight:** `_jcr_content` paths leak into URLs. EDS will require URL restructuring.

---



## 3. Page Inventory & URL Taxonomy



### 3.1 URL Taxonomy


| Pattern                             | Example                                              | Type             |
| ----------------------------------- | ---------------------------------------------------- | ---------------- |
| `/`                                 | `moogparts.com/`                                     | Homepage         |
| `/parts/{cat}.html`                 | `/parts/steering.html`                               | L1 Category      |
| `/parts/{cat}/{subcat}.html`        | `/parts/steering/tie-rod-ends.html`                  | L2 Subcategory   |
| `/parts/{cat}/{subcat}/{line}.html` | `/parts/driveline/.../premium-universal-joints.html` | L3 Product Line  |
| `/moognews.html`                    | `/moognews.html`                                     | News Listing     |
| `/moognews/{slug}.html`             | `/moognews/moog-brand-reports-record-year.html`      | News Article     |
| `/technical/{section}.html`         | `/technical/bulletins.html`                          | Support Section  |
| `/find-my-part.html`                | `/find-my-part.html`                                 | Part Finder Tool |
| `/{locale}/`                        | `/en-ca/`, `/en-eu/`, `/es-mx/`                      | Locale Home      |
| `/about.html`, `/contact.html`      | —                                                    | Utility          |
| `/legal/{page}.html`                | `/legal/privacy-policy.html`                         | Legal            |


**Max depth:** 3 levels | **Extension:** `.html` canonically | **Total:** 266 URLs (162 HTML + 104 PDFs)

### 3.2 Page Type Complexity


| Type                    | Complexity      | SPA?                | Hybris? | Count   |
| ----------------------- | --------------- | ------------------- | ------- | ------- |
| Homepage                | 🟡 Medium       | No                  | No      | 1       |
| L1 Category             | 🟢 Low          | No                  | No      | 4       |
| L2 Subcategory          | 🟢 Low          | No                  | No      | 20+     |
| L3 Product Line         | 🟢 Low          | No                  | No      | 50+     |
| News Listing/Article    | 🟠 High         | **Yes** (AngularJS) | No      | 80+     |
| Part Finder / Results   | 🔴 **Critical** | **Yes** (AngularJS) | **Yes** | Dynamic |
| Technical / Diagnostic  | 🟢 Low          | No                  | No      | ~15     |
| About / Contact / Legal | 🟢 Low          | No                  | No      | ~8      |
| Technologies            | 🟢 Low          | No                  | No      | 1       |
| Locale Variants (16+)   | 🟡 Medium       | Varies              | Varies  | ~260    |




### 3.3 Sitemap Coverage


| Sitemap                    | Status    | Notes         |
| -------------------------- | --------- | ------------- |
| `/en_US.sitemap.xml`       | ✅ 200     | 266 URLs      |
| `/en-eu/en_EU.sitemap.xml` | ❌ Missing | No sitemap    |
| `/en-ca/en_CA.sitemap.xml` | ❌ Missing | No sitemap    |
| All other 23 locales       | ❌ Missing | Zero coverage |


> **⚠️ Critical SEO Gap:** 26 non-US locales have **zero sitemap coverage**. Sitemap index has `es-us`/`en_US` misconfiguration.

---



## 4. Technology Stack Deep Dive



### 4.1 Frontend Framework


| Technology         | Usage                              | Status          |
| ------------------ | ---------------------------------- | --------------- |
| **AngularJS 1.x**  | Primary SPA (`ng-app="fmmp.moog"`) | **⚠️ EOL 2022** |
| **Vue.js**         | Present in some components         | Mixed legacy    |
| **AEM ClientLibs** | 35+ `/etc.clientlibs/` resources   | Current         |


**AngularJS pages:** `/moognews.html`, `/moognews/{slug}.html`, `/find-my-part.html`, `/find-my-part/part-number-results.html`.  
**Migration implication:** EDS serves static HTML — AngularJS templates won't render. Must replace with EDS blocks + API composition or micro-frontend.

### 4.2 Commerce — Hybris/SAP Commerce API

```
API Base: /driv/partfinder/api.catalog.*
├── api.catalog.years     → GET (brand_codes, locale, country_code, vehicle_group_ids)
├── api.catalog.partslist → GET (brand, locale, country_code, year_id, make_id, model_id, digital_assets)
└── api.catalog.product   → (via drivparts.com cross-domain redirect)
```

**Cross-domain flow:** moogparts.com → search "K80771" → redirect to `drivparts.com/part-details.html?brand_code=BCCH&part_number=K80771`

> **⚠️ Risk:** Product detail page lives on **separate domain** `drivparts.com` (different AEM instance).



### 4.3 Tag Management & Analytics


| System       | ID                             | Purpose             |
| ------------ | ------------------------------ | ------------------- |
| GTM          | `GTM-TMZW9Q`                   | Tag container       |
| GA4          | `G-1R8B8715FL`, `G-C9KD04N0PL` | Analytics           |
| Google Ads   | `AW-821429121`, `AW-603257083` | Conversion          |
| Floodlight   | `DC-5321506`                   | Campaign            |
| Meta Pixel   | Present                        | Retargeting         |
| OneTrust     | C0001–C0004                    | Consent             |
| Adobe Launch | **Not present**                | Expected but absent |


The site fires pixels to **15+ ad vendors** (Zeta, Xandr, Audience Manager, PubMatic, OpenX, RhythmOne, Media.net, LiveRamp, TremorHub, etc.) — these must be preserved.

---



## 5. Component Inventory & Block Mapping



### 5.1 Custom AEM Components → EDS Block Mapping


| Current Component     | Usage                | EDS Block                         | Complexity   |
| --------------------- | -------------------- | --------------------------------- | ------------ |
| Header / Navigation   | All pages            | `header` (boilerplate)            | Low          |
| Footer                | All pages            | `footer` (boilerplate)            | Low          |
| Hero / Banner         | Homepage, categories | `hero` block                      | Low          |
| Product Card Grid     | L2 pages             | `cards` block                     | Low          |
| Image + Text          | L3 product pages     | `columns` block                   | Low          |
| Tout / Callout        | L1, L2 pages         | `highlight` block                 | Low          |
| Todo List             | L3 pages             | `list` block                      | Low          |
| Foreground Image      | L2, L3 pages         | `marquee` block                   | Low          |
| Vehicle Selector      | Many pages           | **Custom block** (API-integrated) | **Critical** |
| Part Number Search    | Find My Part         | **Custom block** (API-integrated) | High         |
| News Listing          | News page            | `blog-posts` block                | Medium       |
| Tech Tips / Bulletins | Sidebar              | `article-list` block              | Low          |
| Where to Buy          | Homepage, sidebar    | **Custom block** (API-integrated) | High         |
| Diagnostic Center     | Technical pages      | `columns`/`table` block           | Low          |
| Accordion / Tabs      | Technical pages      | `accordion` block                 | Low          |
| Cookie Consent        | All pages            | `cookie-consent` (customized)     | Medium       |




### 5.2 Global Reusable Blocks

1. **Global Navigation** — Mega-menu: Parts (Steering, Suspension, Driveline, Wheel-End), Support, Technologies, News, Find My Part. Utility: locale picker, Light Commercial Vehicle, Chassis System 101, social links, hamburger menu.
2. **Global Footer** — Main links, sitemap, MOOG + DRiV logos, legal bar (Privacy, Cookie, Terms, Anti-Human Trafficking, Warranty).
3. **Where to Buy (Sidebar)** — ZIP code search widget.
4. **Join Mailing List** — Email signup CTA.
5. **Cookie Consent Banner** — OneTrust integration.



### 5.3 Page-Type Specific Layouts

- **Homepage:** Hero → product grid (3x2) → Where to Buy sidebar → content bands → news carousel → diagnostic links
- **L1 Category:** Hero → subcategory grid → vehicle selector sidebar → SEO text
- **L2 Subcategory:** Foreground image → description → feature list → vehicle selector sidebar
- **L3 Product Line:** Product hero → image+text sections → feature list → vehicle selector sidebar
- **Find My Part (SPA Replacement):** Vehicle search (Year→Make→Model) + Part number search + Results listing → **Custom block + Hybris API**
- **News (SPA Replacement):** Article listing with pagination → `blog-posting` block

---



## 6. Third-Party Integrations & Tag Management



### 6.1 Integration Inventory


| Integration              | Type              | Criticality     | EDS Approach                  |
| ------------------------ | ----------------- | --------------- | ----------------------------- |
| Hybris/SAP Commerce      | Backend API       | 🔴 **Critical** | Custom block + edge worker    |
| Google Tag Manager       | Tag Management    | 🟡 Medium       | ✅ GTM container (direct)      |
| GA4 (x2 properties)      | Analytics         | 🟡 Medium       | ✅ Via GTM                     |
| Google Ads (x2)          | Advertising       | 🟡 Medium       | ✅ Via GTM                     |
| Floodlight (DoubleClick) | Campaign Tracking | 🟡 Medium       | ✅ Via GTM                     |
| Meta Pixel               | Retargeting       | 🟢 Low          | ✅ Via GTM                     |
| OneTrust                 | Consent           | 🟡 Medium       | Custom `cookie-consent` block |
| Ad Pixels (15+ vendors)  | Retargeting       | 🟢 Low          | ✅ Via GTM                     |
| PDF Hosting              | Documents         | 🟢 Low          | ✅ CDN/asset hosting           |




### 6.2 Tag Migration Strategy

Keep GTM as the single tag management layer. Key changes:

- **Remove:** AEM data layer pushes (ContextHub, Granite)
- **Add:** EDS-standard data layer attributes on blocks
- **Verify:** All conversion tracking fires correctly post-migration

---



## 7. Internationalization & Locale Coverage



### 7.1 Current Locale Footprint


| Locale              | Path                            | Sitemap   |
| ------------------- | ------------------------------- | --------- |
| en_US               | `/`                             | ✅ Yes     |
| en_CA, en_EU        | `/en-ca/`, `/en-eu/`            | ❌ Missing |
| es_MX, es_ES        | `/es-mx/`, `/es-es/`            | ❌ Missing |
| fr_FR, de_DE, it_IT | `/fr-fr/`, `/de-de/`, `/it-it/` | ❌ Missing |
| + 10 more           | `/{locale}/`                    | ❌ Missing |


**Total:** 16+ locales, **only 1** has sitemap coverage.

### 7.2 Locale Rollout Approach


| Wave | Locales             | Scope           |
| ---- | ------------------- | --------------- |
| 1    | en_US               | Baseline        |
| 2    | en_CA, en_EU        | English markets |
| 3    | es_MX, es_ES        | Spanish markets |
| 4    | fr_FR, de_DE, it_IT | Western Europe  |
| 5    | Remaining 10+       | All others      |


Each locale inherits global nav/footer, product pages, locale-specific news and legal, and locale-aware Hybris API calls.

---



## 8. SEO Audit Findings



### 8.1 Critical Defects to Remediate


| #   | Issue                                                                                    | Severity  | Fix                                           |
| --- | ---------------------------------------------------------------------------------------- | --------- | --------------------------------------------- |
| 1   | **Hreflang x-default** — points to `/en-eu/` not `/` root                                | 🔴 High   | Correct to `x-default` → `/`                  |
| 2   | **fr-FR hreflang** — resolves to author hostname (`federalmogul-prod-65a.adobecqms.net`) | 🔴 High   | Correct to `https://www.moogparts.com/fr-fr/` |
| 3   | **26 locales missing sitemaps**                                                          | 🔴 High   | Generate sitemaps for all locales             |
| 4   | **Mixed-case URL slugs** in tech tips                                                    | 🟡 Medium | Normalize to lowercase                        |
| 5   | **Author hostname leakage** in CSP and hreflang                                          | 🟡 Medium | Strip from production output                  |
| 6   | **No root sitemap index**                                                                | 🟡 Medium | Create `/sitemap.xml`                         |




### 8.2 SEO Opportunities with EDS

- **Semantic HTML** for better content understanding
- **Core Web Vitals** — optimized for LCP/CLS/INP → better rankings
- **JSON-LD structured data** via EDS blocks
- **Automatic sitemap generation** via EDS tooling
- **Canonical URL management** — reduced duplicate content risk

---



## 9. Performance Baseline



### 9.1 Current State Observations


| Metric              | Observation                           |
| ------------------- | ------------------------------------- |
| AngularJS templates | Not server-rendered                   |
| ClientLibs          | 35+ CSS/JS bundles                    |
| ContextHub          | Personalization engine overhead       |
| Ad pixels           | 15+ vendors on page load              |
| Images              | No WebP, no CDN, no responsive srcset |
| Total requests      | 170+ (50 static + 80 tracking + rest) |




### 9.2 EDS Improvement Potential


| Area       | Current AEM                                    | EDS Target              |
| ---------- | ---------------------------------------------- | ----------------------- |
| HTML size  | 150-300KB                                      | 20-50KB                 |
| CSS        | 200-400KB (35 bundles)                         | ~20KB (critical CSS)    |
| JavaScript | AngularJS (165KB) + Vue (35KB) + jQuery (87KB) | ~10KB (EDS boilerplate) |
| Images     | No CDN, no WebP                                | CDN + WebP + responsive |
| Requests   | 170+                                           | 30-50                   |
| LCP        | Estimated 3-5s                                 | **Target <2.5s**        |
| CLS        | Poor (AngularJS re-render)                     | **Target <0.1**         |


---



## 10. Migration Complexity Signals



### 10.1 Complexity Summary


| Signal                   | Rating          | Impact                                | Mitigation                          |
| ------------------------ | --------------- | ------------------------------------- | ----------------------------------- |
| AngularJS 1.x SPA        | 🔴 **Critical** | News + Find My Part must be rewritten | EDS blocks + API; or micro-frontend |
| Hybris/SAP Commerce      | 🔴 **Critical** | Largest dependency                    | Custom block + SSI/edge worker      |
| 100% Custom Components   | 🟠 **High**     | No Core Components reusable           | Map to standard EDS blocks          |
| Multi-Brand AEM          | 🟠 **High**     | Content isolation risk                | Package filters + export tooling    |
| 16+ Locales              | 🟡 **Medium**   | Scale multiplied                      | Phased rollout after en_US          |
| SEO Defects              | 🟡 **Medium**   | Must fix during migration             | Build fixes into EDS                |
| 15+ Ad Vendors           | 🟢 **Low**      | All via GTM                           | Verify GTM in EDS                   |
| Cross-Domain (drivparts) | 🟡 **Medium**   | Separate AEM instance                 | Preserve redirect or consolidate    |




### 10.2 AngularJS SPA Replacement Strategy

**News pages:** Convert to server-side rendered HTML via EDS:

- Migrate 80+ articles into EDS content repository (CSV/Docs/AEM)
- Create `blog-posting` block for articles, `blog-posts` block for listing
- Replace `{{lede.heading}}` template strings with static HTML

**Find My Part** — Most complex piece:

- **Option A (Recommended):** Custom EDS blocks calling Hybris APIs via SSI/edge workers
- **Option B (Fallback):** Wrap existing AngularJS app as micro-frontend (iframe/web component)



### 10.3 Hybris API Integration Approach


| API                     | Purpose          | EDS Method                      |
| ----------------------- | ---------------- | ------------------------------- |
| `api.catalog.years`     | Vehicle years    | Edge worker → Hybris → JSON     |
| `api.catalog.partslist` | Parts by vehicle | Edge worker → Hybris → HTML     |
| `api.catalog.product`   | Product detail   | Redirect/proxy to drivparts.com |


**Recommendation:** SSI for initial data (years/makes), client-side AJAX for cascading (models/parts).

---



## 11. Recommended Migration Strategy



### 11.1 Guiding Principles

1. **Preserve URLs** — All existing URLs work via EDS URL mapping
2. **Preserve Functionality** — Every feature identical post-migration
3. **Fix SEO** — Don't carry defects into new platform
4. **Incremental Delivery** — Page-by-page, not big-bang
5. **Parallel Run** — AEM + EDS coexist via reverse proxy



### 11.2 Approach Comparison


| Approach               | Pros                    | Cons                   | Verdict           |
| ---------------------- | ----------------------- | ---------------------- | ----------------- |
| **Big Bang**           | Simple coordination     | High risk, no rollback | ❌ Not recommended |
| **Page-by-Page**       | Low risk, validate each | Slow, complex routing  | ✅ **Preferred**   |
| **Section-by-Section** | Medium risk, coherent   | Section dependencies   | 🟡 Acceptable     |




### 11.3 Content Migration Process

```
AEM Source (JCR, DAM, ClientLibs) 
    → Transform (HTML→MD, Image Refs, Component Mapping) 
    → EDS Target (Markdown, Docs, Block HTML, Configs)
```

**Tools:** AEM content exporter, HTML-to-MD converter, DAM→CDN asset downloader, URL mapper.

### 11.4 Block Development Order


| Order | Block                              | Dependency    | Team                 |
| ----- | ---------------------------------- | ------------- | -------------------- |
| 1     | `header`                           | None          | Frontend             |
| 2     | `footer`                           | None          | Frontend             |
| 3     | `hero`, `cards`, `columns`, `list` | None          | Frontend             |
| 4     | `cookie-consent`                   | OneTrust      | Frontend + Marketing |
| 5     | `blog-posting`, `article-list`     | Content model | Content + Frontend   |
| 6     | **Custom:** `vehicle-selector`     | Hybris API    | Full-stack           |
| 7     | **Custom:** `part-finder`          | Hybris API    | Full-stack           |
| 8     | **Custom:** `where-to-buy`         | Dealer API    | Full-stack           |


---



## 12. Phased Delivery Plan



### Phase 1: Foundation + Utility Pages (Est. 2-3 weeks)

**Scope:**

- Set up EDS project boilerplate and GitHub sync
- Build `header` and `footer` blocks (global)
- Build `cookie-consent` block (OneTrust)
- Migrate utility pages: `/about.html`, `/contact.html`, `/legal/*.html`
- Set up GTM + GA4 + Ads in EDS
- SEO: Fix hreflang x-default, generate en_US sitemap

**Deliverables:**

- [ ] EDS project initialized
- [ ] Global header + footer blocks complete
- [ ] Cookie consent integrated with OneTrust
- [ ] Utility pages live on EDS
- [ ] GTM container fires correctly

**Validation:**

- [ ] Content matches AEM production
- [ ] Analytics events fire correctly
- [ ] Cookie consent flow works
- [ ] 404/5xx handling in place

---



### Phase 2: Homepage + Category Pages (Est. 3-4 weeks)

**Scope:**

- Build `hero`, `cards`, `columns`, `marquee`, `list` blocks
- Migrate Homepage
- Migrate L1 categories (`/parts/steering.html`, etc.)
- Migrate L2 subcategories (`/parts/steering/tie-rod-ends.html`, etc.)
- Build `where-to-buy` custom block (ZIP code search)

**Deliverables:**

- [ ] Core block library complete
- [ ] Homepage migrated and validated
- [ ] All 4 L1 category pages migrated
- [ ] All L2 subcategory pages migrated
- [ ] Where to Buy widget functional

**Validation:**

- [ ] Visual parity with AEM (screenshot comparison)
- [ ] All links working
- [ ] Vehicle selector on correct pages
- [ ] ZIP search returns results

---



### Phase 3: Product + Technical Pages (Est. 3-4 weeks)

**Scope:**

- Migrate L3 product line pages (50+)
- Migrate Technical Hub (`/technical.html`)
- Migrate Bulletins (`/technical/bulletins.html`)
- Migrate Diagnostic Center pages
- Migrate Technologies page

**Deliverables:**

- [ ] All L3 product pages migrated
- [ ] Technical section complete
- [ ] Diagnostic Center content migrated
- [ ] Technologies page migrated

**Validation:**

- [ ] All images render correctly
- [ ] PDF links work
- [ ] Diagnostic Center interactivity preserved

---



### Phase 4: News + Content (Est. 3-4 weeks)

**Scope:**

- Build `blog-posting` block for news articles
- Build `blog-posts` block for news listing
- Migrate 80+ news articles
- Replace AngularJS rendering with static EDS HTML

**Deliverables:**

- [ ] News listing page with pagination on EDS
- [ ] All 80+ news articles migrated
- [ ] AngularJS removed from news section

**Validation:**

- [ ] Articles render without JavaScript
- [ ] Dates, headings, images match AEM
- [ ] Pagination works correctly
- [ ] Old AngularJS news redirects to EDS version



### Phase 5: Find My Part — SPA Replacement (Est. 5-8 weeks)

**Scope:**

- Build custom `vehicle-selector` block (Year→Make→Model)
- Build custom `part-finder` block (part number search)
- Build custom `part-results` block (search results listing)
- Build API integration layer (SSI + edge worker)
- Replace AngularJS Part Finder entirely
- Coordinate with drivparts.com for cross-domain product details

**Deliverables:**

- [ ] Vehicle selector works with live Hybris data
- [ ] Part number search returns results
- [ ] Search results render correctly
- [ ] Part click redirects to drivparts.com (or inline detail)
- [ ] AngularJS removed from entire site

**Validation:**

- [ ] All vehicle combos return correct parts
- [ ] Part K80771 search returns correct product
- [ ] Cross-domain redirect to drivparts.com works
- [ ] No AngularJS errors in console
- [ ] Search analytics fire into GA4

---



### Phase 6: Locale Rollout + SEO (Est. 4-6 weeks per batch)

**Scope:**

- Wave 1: en_CA, en_EU
- Wave 2: es_MX, es_ES
- Wave 3: fr_FR, de_DE, it_IT
- Wave 4: Remaining 10+ locales
- Generate sitemaps for all locales
- Fix all remaining SEO defects

**Deliverables:**

- [ ] All 16+ locales migrated to EDS
- [ ] Sitemaps submitted to Google Search Console
- [ ] Hreflang annotations correct
- [ ] Mixed-case slugs normalized

**Validation:**

- [ ] Each locale renders with correct language
- [ ] Locale-specific content appears correctly
- [ ] Sitemaps pass Google validation
- [ ] No 4xx/5xx from search crawls

---



## 13. Risk Register


| #   | Risk                                               | Likelihood | Impact       | Mitigation                                               |
| --- | -------------------------------------------------- | ---------- | ------------ | -------------------------------------------------------- |
| R1  | AngularJS SPA cannot be replicated in EDS          | Medium     | **Critical** | Evaluate micro-frontend early; POC in Phase 1            |
| R2  | Hybris API changes needed for EDS                  | Medium     | **Critical** | Engage Hybris team early; define API contract in Phase 1 |
| R3  | Content extraction from multi-brand AEM incomplete | Medium     | High         | Build extraction tool; validate vs sitemap               |
| R4  | Cross-domain drivparts.com breaks                  | Low        | High         | Preserve redirect; add 404 monitoring                    |
| R5  | SEO rankings drop during migration                 | Medium     | High         | URL mapping; 301 redirects; Search Console monitoring    |
| R6  | Locales have divergent page structures             | Medium     | Medium       | Audit 3+ representative locales before building          |
| R7  | OneTrust consent flow differs in EDS               | Low        | Medium       | Test early; involve legal                                |
| R8  | Ad pixels cause performance regression             | Low        | Medium       | Audit pixel load; consolidate where possible             |


**Rollback:**

- Per-page: EDS URLs redirected back to AEM via reverse proxy
- Per-section: Sections like `/parts/*` routed back to AEM
- Full: Update DNS to point back to AEM (requires TTL planning)

---



## 14. Appendices



### A. Verified URLs (HTTP 200)

```
✅ / (Homepage)
✅ /parts/steering.html
✅ /parts/suspension.html
✅ /parts/driveline.html
✅ /parts/wheel-end.html
✅ /parts/steering/tie-rod-ends.html
✅ /parts/suspension/ball-joints.html
✅ /parts/suspension/control-arms.html
✅ /parts/driveline/universal-joints/premium-universal-joints.html
✅ /moognews.html
✅ /find-my-part.html
✅ /technical.html
✅ /technical/bulletins.html
✅ /technical/diagnostic-center.html
✅ /technical/diagnostic-center/car-crossover.html
✅ /about.html
✅ /contact.html
✅ /technologies.html
✅ /legal/privacy-policy.html
✅ /light-commercial-vehicle.html
✅ /parts-matter.html
```



### B. AEM Instance Evidence

```
Author hostname:    author-driv-prod.adobecqms.net
AEM version:        6.x
Content path base:  /content/loc-na/loc-us/fmmp-moog/en_US/
```



### C. Data Layer Variables (inferred from GTM)

```
ep.default_name = "main"
ep.brand_name   = "moog"
ep.region_name  = "na"
ep.country_name = "us"
ep.language_name = "en"
up.user_type    = "Anonymous"
```



### D. Hybris API Contract (Observed)

```json
// GET /driv/partfinder/api.catalog.years
// Parameters: { "brand_codes": "2100", "locale": "en_US", "country_code": "us", "vehicle_group_ids": "1" }

// GET /driv/partfinder/api.catalog.partslist
// Parameters: { "brand": "moog", "locale": "en_US", "country_code": "US", 
//               "no_cache": "timestamp", "vehicle_group_ids": "2", "year_id": "2020",
//               "make_id": "54", "model_id": "666", "digital_assets": "true" }
```

---



## Report Conclusion

The migration of **moogparts.com** from AEM On-Premise to AEM Edge Delivery Services is a **complex but achievable** undertaking. The primary challenges are:

1. **Replacing the AngularJS 1.x SPA** for news and the Part Finder tool
2. **Integrating with Hybris/SAP Commerce** via EDS-compatible API patterns
3. **Rebuilding 100% custom AEM components** as EDS blocks
4. **Rolling out to 16+ locales** with SEO remediation

**Estimated timeline:** 5-6 months (assuming 2-3 frontend developers, 1 full-stack developer for API integration, 1 content author)

**Recommendation:** Proceed with Phase 1 immediately to validate the migration approach with low-risk utility pages, while conducting a proof-of-concept for the Hybris API integration and AngularJS replacement strategy.

---

*Report generated from Phase 1 baseline analysis — 27 June 2026*