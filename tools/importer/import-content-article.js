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
      "https://www.moogparts.com/moognews/solid-sway-bar-kits-release.html",
      "https://www.moogparts.com/moognews/MOOG-Releases-Over-70-New-Part-Numbers.html",
      "https://www.moogparts.com/moognews/expands-parts-offering-in-october-2019.html",
      "https://www.moogparts.com/moognews/moog-announces-new-control-arm-part-numbers.html",
      "https://www.moogparts.com/moognews/moog-announces-part-numbers-expansion-in-january-february.html",
      "https://www.moogparts.com/moognews/moog-continues-product-expansion-into-2019.html",
      "https://www.moogparts.com/moognews/moog-creates-enhancements-premium-control-arms-providing-greater-durability-reliability.html",
      "https://www.moogparts.com/parts-matter/all-about-ball-joints.html",
      "https://www.moogparts.com/parts-matter/all-about-hub-assemblies.html",
      "https://www.moogparts.com/parts-matter/all-about-tie-rods.html",
      "https://www.moogparts.com/parts-matter/ball-joints-tie-rods-whats-the-difference.html",
      "https://www.moogparts.com/parts-matter/dangers-of-potholes.html",
      "https://www.moogparts.com/parts-matter/difference-between-tire-alignment-rotation.html",
      "https://www.moogparts.com/parts-matter/failing-driveshaft.html",
      "https://www.moogparts.com/parts-matter/five-ways-bad-alignment-wrecks-tires.html",
      "https://www.moogparts.com/parts-matter/guide-to-control-arms.html",
      "https://www.moogparts.com/parts-matter/how-often-should-my-suspension-steering-systems-be-inspected.html",
      "https://www.moogparts.com/parts-matter/parts-of-a-car.html",
      "https://www.moogparts.com/parts-matter/pothole-damage-to-cars.html",
      "https://www.moogparts.com/parts-matter/surviving-pothole-season-old.html",
      "https://www.moogparts.com/parts-matter/surviving-pothole-season.html",
      "https://www.moogparts.com/parts-matter/symptoms-of-bad-ball-joints.html",
      "https://www.moogparts.com/parts-matter/symptoms-of-bad-tie-rods.html",
      "https://www.moogparts.com/parts-matter/what-causes-grinding-noise-under-my-car.html",
      "https://www.moogparts.com/parts-matter/why-are-my-tires-wearing-unevenly.html",
      "https://www.moogparts.com/parts-matter/why-does-my-steering-feel-loose.html",
      "https://www.moogparts.com/parts-matter/why-is-my-car-vibrating.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/Getting-the-Right-Replacement-Universal-Joint.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/How-to-Adjust-Camber-and-Caster-on-Non-Adjustable-Vehicles.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/How-to-Get-the-Right-Front-Hub-Assembly-for-2007-Chevy-and-GMC-Trucks.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/How-to-Install-a-Cotter-Pin-on-a-Castle-Nut.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/How-to-Install-a-Hub-Assembly.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/How-to-Isolate-Suspension-Noises.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/Selecting-the-Correct-Control-Arm-for-2014-2020-Chevrolet-Silverado-and-GMC-Sierra-1500-Trucks.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/U-Joints-for-2013-2018-Ram-2500-3500-with-Cummins-6-7L-Engine.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/Why-an-Alignment-is-Needed-After-an-Outer-Tie-Rod-Replacement.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/avoiding-sway-bar-link-damage-due-to-overtightening.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/ball-joint-installation-tips.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/checking-stud-taper-fitment-chassis-parts.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/elliptical-opening-press-in-ball-joint-installation-tip.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/finding-the-right-replacement-u-joint.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/getting-the-right-ball-Joint-for-2014-2016-chevrolet-silverado-and-gmc-sierra-1500-trucks.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/gm-1500-ball-joint-and-control-arm-fitment.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/grease-requirements-for-steering-suspension-parts.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/greasing-hard-to-access-chassis-parts.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-avoid-steering-knuckle-damage-from-overtightening.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-inspect-ball-joints-for-looseness.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-install-dust-boot-on-ball-joint.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-install-self-locking-nut-on-ball-joint-with-tapered-stud.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-properly-tighten-axle-nut-on-wheel-hub-bearing.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-remove-and-install-a-cv-axle.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-replace-lower-ball-joint-with-insert-over-stud.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-test-ball-joints-for-movement-dodge-ram-jeep.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-torque-rubber-suspension-bushings.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/how-to-torque-stud-nut-on-ball-joint.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/importance-of-proper-torquing-for-aluminum-suspension-parts.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/installing-servicing-moog-universal-joints.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/pinch-bolt-style-ball-joint-installation-tip.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/resolving-error-codes-after-hub-replacement-subaru.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/resolving-parking-brake-spring-clearance-issues-ford-lincoln-mercury.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/resolving-upper-ball-joint-failure-dodge-ram-trucks.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/restoring-handling-with-moog-solid-sway-bar-kit.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/selecting-right-tie-rod-ford-super-duty-trucks.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/solving-center-link-bushing-wear-on-chevy-hd-trucks.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/solving-memory-steer-ford-ram.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/solving-premature-outer-tie-rod-failure-ford-fusion-lincoln-mkz.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/tie-rod-installation-tips.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/tip-for-installing-ball-joints-on-subaru-applications.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/tips-for-replacing-a-cv-axle.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/track-bar-ball-joint-solves-front-end-shimmy.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/troubleshooting-vertical-control-arm-bushing-failure.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/using-proper-stud-fasteners-for-ball-joint-tie-rod-end-repairs.html",
      "https://www.moogparts.com/technical/bulletins/tech-tips/when-to-use-a-moog-oversized-ball-joint.html"
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
