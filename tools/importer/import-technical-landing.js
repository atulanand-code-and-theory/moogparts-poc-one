/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroOverlayParser from "./parsers/hero-overlay.js";
import columnsSplitParser from "./parsers/columns-split.js";

// TRANSFORMER IMPORTS
import cleanupTransformer from "./transformers/moogparts-cleanup.js";
import sectionsTransformer from "./transformers/moogparts-sections.js";

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
    "name": "technical-landing",
    "description": "Support/technical overview landing pages: a page-title header followed by a stack of image+text feature rows (touts), used by the Support landing, Training, Technical Content (bulletins) and Diagnostic Center intro pages.",
    "urls": [
      "https://www.moogparts.com/technical.html",
      "https://www.moogparts.com/technical/training.html",
      "https://www.moogparts.com/technical/bulletins.html",
      "https://www.moogparts.com/technical/diagnostic-center.html"
    ],
    "blocks": [
      {
        "name": "hero-overlay",
        "instances": [
          ".header-hero",
          ".header-simple"
        ]
      },
      {
        "name": "columns-split",
        "instances": [
          ".tout"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Page title / hero header",
        "selector": [
          ".header-hero",
          ".header-simple"
        ],
        "style": null,
        "blocks": [
          "hero-overlay"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Tout feature-row stack",
        "selector": ".tout",
        "style": null,
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      }
    ]
  };

// PARSER REGISTRY
const parsers = {
  "hero-overlay": heroOverlayParser,
  "columns-split": columnsSplitParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try { transformerFn.call(null, hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) { console.warn(`Block "${blockDef.name}" selector not found: ${selector}`); }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
      });
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
      if (parser) {
        try { parser(block.element, { document, url, params }); }
        catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
      } else { console.warn(`No parser found for block: ${block.name}`); }
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
