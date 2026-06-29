/* eslint-disable */
/* global WebImporter */

import heroOverlayParser from './parsers/hero-overlay.js';
import columnsSplitParser from './parsers/columns-split.js';
import widgetParser from './parsers/widget.js';
import cleanupTransformer from './transformers/moogparts-cleanup.js';
import sectionsTransformer from './transformers/moogparts-sections.js';

const PAGE_TEMPLATE = {
    "name": "content-article",
    "description": "Long-form content/article pages: headings, body copy, comparison images, embedded video/category tables and a closing Where-to-Buy locator. Used by Know Your Parts and the Independent Testing Results page.",
    "urls": [
      "https://www.moogparts.com/technical/training/know-your-parts.html",
      "https://www.moogparts.com/technical/something-big-moog-app.html",
      "https://www.moogparts.com/parts-matter/How-to-Tell-If-You-Have-a-Bad-Universal-Joint.html",
      "https://www.moogparts.com/parts-matter/Signs-of-a-Failing-Control-Arm.html",
      "https://www.moogparts.com/parts-matter/Symptoms-of-Bad-Sway-Bar-Links.html",
      "https://www.moogparts.com/parts-matter/What-Are-U-Joints.html",
      "https://www.moogparts.com/parts-matter/What-is-a-CV-Axle.html",
      "https://www.moogparts.com/parts-matter/Whats-Inside-a-Socket-Style-Part.html",
      "https://www.moogparts.com/parts-matter/adjusting-your-car-alignment.html",
      "https://www.moogparts.com/parts-matter/car-alignment.html",
      "https://www.moogparts.com/parts-matter/signs-you-need-an-alignment.html",
      "https://www.moogparts.com/technologies/videos/cover-plate-belleville-washer.html",
      "https://www.moogparts.com/technologies/videos/greasable-design.html",
      "https://www.moogparts.com/technologies/videos/gusher-bearing.html",
      "https://www.moogparts.com/technologies/videos/heat-treated-stud.html",
      "https://www.moogparts.com/moognews/solid-sway-bar-kits-release.html"
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

const parsers = {
  'hero-overlay': heroOverlayParser,
  'columns-split': columnsSplitParser,
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
