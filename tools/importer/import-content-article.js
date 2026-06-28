/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroOverlayParser from "./parsers/hero-overlay.js";
import columnsSplitParser from "./parsers/columns-split.js";
import widgetParser from "./parsers/widget.js";

// TRANSFORMER IMPORTS
import cleanupTransformer from "./transformers/moogparts-cleanup.js";
import sectionsTransformer from "./transformers/moogparts-sections.js";

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
    "name": "content-article",
    "description": "Long-form content/article pages: headings, body copy, comparison images, embedded video/category tables and a closing Where-to-Buy locator. Used by Know Your Parts and the Independent Testing Results page.",
    "urls": [
      "https://www.moogparts.com/technical/training/know-your-parts.html",
      "https://www.moogparts.com/technical/something-big-moog-app.html"
    ],
    "blocks": [
      {
        "name": "hero-overlay",
        "instances": [
          ".header-hero .header-hero-container"
        ]
      },
      {
        "name": "columns-split",
        "instances": [
          ".tout"
        ]
      },
      {
        "name": "widget",
        "instances": [
          ".where-to-buy-link"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Article hero header",
        "selector": ".header-hero .header-hero-container",
        "style": null,
        "blocks": [
          "hero-overlay"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "Article body content",
        "selector": ".fmmp-title",
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".fmmp-title",
          ".article"
        ]
      },
      {
        "id": "section-3",
        "name": "Quality Parts Matter intro (gap)",
        "selector": ".tout",
        "style": null,
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "Where to Buy locator",
        "selector": ".where-to-buy-link",
        "style": null,
        "blocks": [
          "widget"
        ],
        "defaultContent": []
      }
    ]
  };

// PARSER REGISTRY
const parsers = {
  "hero-overlay": heroOverlayParser,
  "columns-split": columnsSplitParser,
  widget: widgetParser,
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
