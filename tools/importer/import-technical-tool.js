/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import widgetParser from "./parsers/widget.js";
import cardsArticleParser from "./parsers/cards-article.js";

// TRANSFORMER IMPORTS
import cleanupTransformer from "./transformers/moogparts-cleanup.js";
import sectionsTransformer from "./transformers/moogparts-sections.js";

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
    "name": "technical-tool",
    "description": "Interactive tool pages backed by a widget app: bulletin PDF search/listing (problem-solver, did-you-know), the interactive diagnostic-center symptom selector (car-crossover, light-truck-suv), and the installation-guide part-number search. Each hosts a named interactive widget plus an optional cross-sell cards band.",
    "urls": [
      "https://www.moogparts.com/technical/bulletins/problem-solver-bulletins.html",
      "https://www.moogparts.com/technical/bulletins/did-you-know-bulletins.html",
      "https://www.moogparts.com/technical/diagnostic-center/car-crossover.html",
      "https://www.moogparts.com/technical/diagnostic-center/light-truck-suv.html",
      "https://www.moogparts.com/technical/bulletins/installation-instructions.html"
    ],
    "blocks": [
      {
        "name": "widget",
        "instances": [
          ".search-files",
          ".diagnostic-center",
          ".documents-autocomplete"
        ]
      },
      {
        "name": "cards-article",
        "instances": [
          ".cross-sell"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Interactive widget tool",
        "selector": [
          ".search-files",
          ".diagnostic-center",
          ".documents-autocomplete"
        ],
        "style": null,
        "blocks": [
          "widget"
        ],
        "defaultContent": [
          ".header-simple"
        ]
      },
      {
        "id": "section-2",
        "name": "Cross-sell product cards",
        "selector": ".cross-sell",
        "style": null,
        "blocks": [
          "cards-article"
        ],
        "defaultContent": []
      }
    ]
  };

// PARSER REGISTRY
const parsers = {
  widget: widgetParser,
  "cards-article": cardsArticleParser,
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
