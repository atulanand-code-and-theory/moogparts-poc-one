/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroOverlayParser from './parsers/hero-overlay.js';
import cardsCategoryParser from './parsers/cards-category.js';
import widgetParser from './parsers/widget.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/moogparts-cleanup.js';
import sectionsTransformer from './transformers/moogparts-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'parts-landing',
  description: 'MOOG Parts category landing page: hero banner with foreground image, 2x4 grid of part category tiles (Steering, Suspension, Driveline, Wheel End), and a Where to Buy / ZIP locator band.',
  urls: [
    'https://www.moogparts.com/parts.html',
  ],
  blocks: [
    {
      name: 'hero-overlay',
      instances: ['.header-foreground'],
    },
    {
      name: 'cards-category',
      instances: ['.hover-tout'],
    },
    {
      name: 'widget',
      instances: ['.where-to-buy-link'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'MOOG parts hero banner',
      selector: '.header-foreground',
      style: null,
      blocks: ['hero-overlay'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Part category tiles',
      selector: '.hover-tout',
      style: null,
      blocks: ['cards-category'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Where to Buy ZIP locator',
      selector: '.where-to-buy-link',
      style: null,
      blocks: ['widget'],
      defaultContent: [],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-overlay': heroOverlayParser,
  'cards-category': cardsCategoryParser,
  widget: widgetParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already detached by a prior parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (root path maps to /index)
    const pathname = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html$/, '');
    const path = WebImporter.FileUtils.sanitizePath(pathname || '/index');

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
