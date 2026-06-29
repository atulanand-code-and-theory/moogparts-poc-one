/* eslint-disable */
/* global WebImporter */

import heroOverlayParser from "./parsers/hero-overlay.js";
import columnsSplitParser from "./parsers/columns-split.js";
import cardsBenefitsParser from "./parsers/cards-benefits.js";
import widgetParser from "./parsers/widget.js";
import cleanupTransformer from "./transformers/moogparts-cleanup.js";
import sectionsTransformer from "./transformers/moogparts-sections.js";

const PAGE_TEMPLATE = {
    "name": "parts-product",
    "description": "Parts product-detail pages: foreground hero banner (MOOG <PRODUCT>), a feature section (headline + product image + bulleted benefits + Get it Installed/Buy CTAs), a Quick-Look Benefits grid, and a YMM part-finder widget.",
    "urls": [
      "https://www.moogparts.com/parts/steering/idler-arms.html",
      "https://www.moogparts.com/parts/driveline/constant-velocity-axles.html",
      "https://www.moogparts.com/parts/driveline/couplers.html",
      "https://www.moogparts.com/parts/driveline/pto-ag.html",
      "https://www.moogparts.com/parts/driveline/universal-joints/anti-galvanic-universal-joints.html",
      "https://www.moogparts.com/parts/driveline/universal-joints/heavy-duty-universal-joints.html",
      "https://www.moogparts.com/parts/driveline/universal-joints/premium-universal-joints.html",
      "https://www.moogparts.com/parts/driveline/universal-joints/super-strength-universal-joints.html",
      "https://www.moogparts.com/parts/steering/center-drag-link.html",
      "https://www.moogparts.com/parts/steering/complete-pre-assembled-steering-linkage.html",
      "https://www.moogparts.com/parts/steering/pitman-arms.html",
      "https://www.moogparts.com/parts/steering/steering-stabilizers.html",
      "https://www.moogparts.com/parts/steering/tie-rod-ends.html",
      "https://www.moogparts.com/parts/suspension/alignment-parts/adjustable-ball-joints.html",
      "https://www.moogparts.com/parts/suspension/alignment-parts/adjustable-bushings.html",
      "https://www.moogparts.com/parts/suspension/alignment-parts/adjustment-cams-and-cam-bolts.html",
      "https://www.moogparts.com/parts/suspension/alignment-parts/cam-plate-adjusting-kits.html",
      "https://www.moogparts.com/parts/suspension/alignment-parts/control-arm-shafts-and-control-arm-mounts.html",
      "https://www.moogparts.com/parts/suspension/alignment-parts/rear-contact-shims.html",
      "https://www.moogparts.com/parts/suspension/ball-joints.html",
      "https://www.moogparts.com/parts/suspension/coil-springs.html",
      "https://www.moogparts.com/parts/suspension/moog-control-arms.html",
      "https://www.moogparts.com/parts/suspension/solid-sway-bar-kits.html",
      "https://www.moogparts.com/parts/suspension/sway-bar-links.html",
      "https://www.moogparts.com/parts/suspension/vehicle-bushings/bushings.html",
      "https://www.moogparts.com/parts/suspension/vehicle-bushings/sway-bar-bushings.html",
      "https://www.moogparts.com/parts/wheel-end/complete-knuckle-assemblies.html",
      "https://www.moogparts.com/parts/wheel-end/hub-assemblies/coated-hub-assemblies.html",
      "https://www.moogparts.com/parts/wheel-end/hub-assemblies/high-utilization-hub-assemblies.html",
      "https://www.moogparts.com/parts/wheel-end/hub-assemblies/premium-hub-assemblies.html"
    ],
    "blocks": [
      {
        "name": "hero-overlay",
        "instances": [
          ".header-foreground",
          ".header-hero"
        ]
      },
      {
        "name": "columns-split",
        "instances": [
          ".product-feature"
        ]
      },
      {
        "name": "cards-benefits",
        "instances": [
          ".product-benefits"
        ]
      },
      {
        "name": "widget",
        "instances": [
          ".ymm-search"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Product hero banner",
        "selector": [
          ".header-foreground",
          ".header-hero"
        ],
        "style": null,
        "blocks": [
          "hero-overlay"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Product feature row",
        "selector": ".product-feature",
        "style": null,
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Quick-Look Benefits",
        "selector": ".product-benefits",
        "style": null,
        "blocks": [
          "cards-benefits"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "YMM part finder",
        "selector": ".ymm-search",
        "style": null,
        "blocks": [
          "widget"
        ],
        "defaultContent": []
      }
    ]
  };

const parsers = {
  "hero-overlay": heroOverlayParser,
  "columns-split": columnsSplitParser,
  "cards-benefits": cardsBenefitsParser,
  widget: widgetParser,
};

const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => { try { fn.call(null, hookName, element, enhancedPayload); } catch (e) { console.error(`Transformer failed at ${hookName}:`, e); } });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) { console.warn(`Block "${blockDef.name}" selector not found: ${selector}`); }
      elements.forEach((element) => { pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null }); });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;
    executeTransformers("beforeTransform", main, payload);
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) { try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); } }
      else { console.warn(`No parser found for block: ${block.name}`); }
    });
    executeTransformers("afterTransform", main, payload);
    const hr = document.createElement("hr");
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const pathname = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "");
    const path = WebImporter.FileUtils.sanitizePath(pathname || "/index");
    return [{ element: main, path, report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) } }];
  },
};
