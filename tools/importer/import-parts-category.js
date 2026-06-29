/* eslint-disable */
/* global WebImporter */

import heroOverlayParser from "./parsers/hero-overlay.js";
import cardsArticleParser from "./parsers/cards-article.js";
import widgetParser from "./parsers/widget.js";
import cleanupTransformer from "./transformers/moogparts-cleanup.js";
import sectionsTransformer from "./transformers/moogparts-sections.js";

const PAGE_TEMPLATE = {
    "name": "parts-category",
    "description": "Parts category landing pages: foreground hero banner (MOOG <CATEGORY>), a grid of product-type cards (image + title + short description + View Product), and a YMM (year/make/model) part-finder widget.",
    "urls": [
      "https://www.moogparts.com/parts/driveline.html",
      "https://www.moogparts.com/parts/driveline/universal-joints.html",
      "https://www.moogparts.com/parts/steering.html",
      "https://www.moogparts.com/parts/suspension.html",
      "https://www.moogparts.com/parts/suspension/alignment-parts.html",
      "https://www.moogparts.com/parts/suspension/vehicle-bushings.html",
      "https://www.moogparts.com/parts/wheel-end.html",
      "https://www.moogparts.com/parts/wheel-end/hub-assemblies.html"
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
        "name": "cards-article",
        "instances": [
          ".main-par .tout"
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
        "name": "Category hero banner",
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
        "name": "Product-type card grid",
        "selector": ".main-par .tout",
        "style": null,
        "blocks": [
          "cards-article"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
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
  "cards-article": cardsArticleParser,
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
