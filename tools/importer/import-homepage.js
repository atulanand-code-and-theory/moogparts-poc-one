/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroOverlayParser from './parsers/hero-overlay.js';
import widgetParser from './parsers/widget.js';
import columnsSplitParser from './parsers/columns-split.js';
import cardsArticleParser from './parsers/cards-article.js';
import cardsCategoryParser from './parsers/cards-category.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/moogparts-cleanup.js';
import sectionsTransformer from './transformers/moogparts-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'MOOG Parts homepage: hero banners, part finder, blue bulletins/diagnostic band, article ledes, category tiles, mailing list CTA',
  urls: [
    'https://www.moogparts.com/',
  ],
  blocks: [
    {
      name: 'hero-overlay',
      instances: [
        '.header-hero:nth-of-type(1) .header-hero-container',
        '.header-hero:nth-of-type(2) .header-hero-container',
      ],
    },
    {
      name: 'widget',
      instances: ['.driv-part-finder-main'],
    },
    {
      name: 'columns-split',
      instances: ['#page-content .responsivegrid .aem-Grid--12 > .responsivegrid:has(.text-content)'],
    },
    {
      name: 'cards-article',
      instances: ['.ledes .ledes-container'],
    },
    {
      name: 'cards-category',
      instances: ['.hover-tout'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Problem Solver Technologies hero',
      selector: '.header-hero:nth-of-type(1) .header-hero-container',
      style: null,
      blocks: ['hero-overlay'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Find My Part finder',
      selector: '.driv-part-finder-main',
      style: 'light',
      blocks: ['widget'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Excellence Never Quits hero',
      selector: '.header-hero:nth-of-type(2) .header-hero-container',
      style: null,
      blocks: ['hero-overlay'],
      defaultContent: [],
    },
    {
      id: 'section-4',
      name: 'Bulletins + Diagnostic Center',
      selector: '#page-content .responsivegrid .aem-Grid--12 > .responsivegrid:has(.text-content)',
      style: 'blue',
      blocks: ['columns-split'],
      defaultContent: [],
    },
    {
      id: 'section-5',
      name: 'Parts Matter article ledes',
      selector: '.ledes .ledes-container',
      style: 'grey',
      blocks: ['cards-article'],
      defaultContent: [],
    },
    {
      id: 'section-6',
      name: 'Product category tiles',
      selector: '.hover-tout',
      style: null,
      blocks: ['cards-category'],
      defaultContent: [],
    },
    {
      id: 'section-7',
      name: 'Mailing list CTA',
      selector: '.social-feed .mailing-list',
      style: 'yellow',
      blocks: [],
      defaultContent: ['.social-feed .mailing-list'],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-overlay': heroOverlayParser,
  widget: widgetParser,
  'columns-split': columnsSplitParser,
  'cards-article': cardsArticleParser,
  'cards-category': cardsCategoryParser,
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
