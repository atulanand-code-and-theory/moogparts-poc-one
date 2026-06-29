/* eslint-disable */
/* global WebImporter */

import heroOverlayParser from './parsers/hero-overlay.js';
import columnsSplitParser from './parsers/columns-split.js';
import cardsArticleParser from './parsers/cards-article.js';
import widgetParser from './parsers/widget.js';
import cleanupTransformer from './transformers/moogparts-cleanup.js';
import sectionsTransformer from './transformers/moogparts-sections.js';

const PAGE_TEMPLATE = {
    "name": "parts-matter-index",
    "description": "Chassis System 101 (Parts Matter) index: title hero, a featured-article banner, an article-teaser card grid (Read More) with View More, plus Find My Part and Where to Buy widgets.",
    "urls": [
      "https://www.moogparts.com/parts-matter.html"
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
      },
      {
        "name": "cards-article",
        "instances": [
          ".ledes"
        ]
      },
      {
        "name": "widget",
        "instances": [
          ".driv-part-finder-main",
          ".where-to-buy-link"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Title hero",
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
        "name": "Featured article",
        "selector": ".tout",
        "style": null,
        "blocks": [
          "columns-split"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Article card grid",
        "selector": ".ledes",
        "style": "grey",
        "blocks": [
          "cards-article"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "Find My Part finder",
        "selector": ".driv-part-finder-main",
        "style": "light",
        "blocks": [
          "widget"
        ],
        "defaultContent": []
      },
      {
        "id": "section-5",
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

const parsers = {
  'hero-overlay': heroOverlayParser,
  'columns-split': columnsSplitParser,
  'cards-article': cardsArticleParser,
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
    executeTransformers('beforeTransform', main, payload);
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) { try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); } }
      else { console.warn(`No parser found for block: ${block.name}`); }
    });
    executeTransformers('afterTransform', main, payload);
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const pathname = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '');
    const path = WebImporter.FileUtils.sanitizePath(pathname || '/index');
    return [{ element: main, path, report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) } }];
  },
};
