/* eslint-disable */
/* global WebImporter */

import heroOverlayParser from './parsers/hero-overlay.js';
import widgetParser from './parsers/widget.js';
import columnsSplitParser from './parsers/columns-split.js';
import cardsArticleParser from './parsers/cards-article.js';
import cardsBenefitsParser from './parsers/cards-benefits.js';
import cardsTimelineParser from './parsers/cards-timeline.js';
import cleanupTransformer from './transformers/moogparts-cleanup.js';
import sectionsTransformer from './transformers/moogparts-sections.js';

const PAGE_TEMPLATE = {
    "name": "standalone",
    "description": "Standalone one-off pages: About, Contact, Email signup, Find My Part, Installation Guide Search, Light Commercial Vehicle, Where to Buy. Heterogeneous mix of widget tools (part finder, ZIP locator, doc search, email form) and content/hero sections. Block detection is per-page; selectors that do not match a given page are skipped.",
    "urls": [
      "https://www.moogparts.com/about.html",
      "https://www.moogparts.com/contact.html",
      "https://www.moogparts.com/email.html",
      "https://www.moogparts.com/find-my-part.html",
      "https://www.moogparts.com/installation-guide-search.html",
      "https://www.moogparts.com/light-commercial-vehicle.html",
      "https://www.moogparts.com/where-to-buy.html"
    ],
    "blocks": [
      {
        "name": "hero-overlay",
        "instances": [
          ".header-hero"
        ]
      },
      {
        "name": "widget",
        "instances": [
          ".driv-part-finder-main",
          ".where-to-buy-search",
          ".where-to-buy-link",
          ".documents-autocomplete",
          ".ymm-search"
        ]
      },
      {
        "name": "columns-split",
        "instances": [
          ".main-par .responsivegrid:has(> div > .fmmp-plaintext .text-content):nth-of-type(1)"
        ]
      },
      {
        "name": "cards-article",
        "instances": [
          ".cross-sell",
          ".carousel-container"
        ]
      },
      {
        "name": "cards-benefits",
        "instances": [
          ".main-par .responsivegrid:has(.text-content) + .responsivegrid img"
        ]
      },
      {
        "name": "cards-timeline",
        "instances": [
          ".timeline"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Page hero/title",
        "selector": [
          ".header-hero",
          ".header-simple"
        ],
        "style": null,
        "blocks": [
          "hero-overlay"
        ],
        "defaultContent": [
          ".header-simple"
        ]
      },
      {
        "id": "section-2",
        "name": "Body content",
        "selector": ".article-par .text-content",
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".article-par .text-content",
          ".text-content"
        ]
      },
      {
        "id": "section-3",
        "name": "Card grid (timeline/cross-sell/carousel)",
        "selector": [
          ".timeline",
          ".cross-sell",
          ".carousel-container"
        ],
        "style": null,
        "blocks": [
          "cards-article",
          "cards-timeline"
        ],
        "defaultContent": []
      },
      {
        "id": "section-4",
        "name": "Interactive widget",
        "selector": [
          ".driv-part-finder-main",
          ".where-to-buy-search",
          ".where-to-buy-link",
          ".documents-autocomplete"
        ],
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
  widget: widgetParser,
  'columns-split': columnsSplitParser,
  'cards-article': cardsArticleParser,
  'cards-benefits': cardsBenefitsParser,
  'cards-timeline': cardsTimelineParser,
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
