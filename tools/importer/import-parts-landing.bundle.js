/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-parts-landing.js
  var import_parts_landing_exports = {};
  __export(import_parts_landing_exports, {
    default: () => import_parts_landing_default
  });

  // tools/importer/parsers/hero-overlay.js
  var normalizeText = (s) => (s || "").replace(/[\s ​‌‍﻿]+/g, "");
  var hasText = (el) => normalizeText(el.textContent).length > 0;
  function parse(element, { document }) {
    const bgContainer = element.querySelector(".header-hero-background") || element.querySelector('[class*="background"]') || element.querySelector(":scope > .has-bg, :scope > div > .has-bg");
    let bgImage = null;
    if (bgContainer) {
      bgImage = bgContainer.querySelector(":scope > img") || bgContainer.querySelector("img");
      if (!bgImage) {
        const pic = bgContainer.querySelector("picture");
        if (pic) bgImage = pic;
      }
      if (!bgImage) {
        const style = bgContainer.getAttribute("style") || "";
        const m = style.match(/url\((['"]?)(.*?)\1\)/i);
        if (m && m[2]) {
          const img = document.createElement("img");
          img.setAttribute("src", m[2]);
          bgImage = img;
        }
      }
    }
    const contentRoot = element.querySelector(".header-hero-content, .header-hero-content-container, .header-content") || element;
    const heading = Array.from(contentRoot.querySelectorAll("h1, h2, h3, h4, h5, h6")).find((h) => hasText(h)) || null;
    const paragraphs = Array.from(contentRoot.querySelectorAll("p")).filter((p) => !p.closest(".foreground-image-mobile, .header-foreground-image")).filter((p) => hasText(p) || p.querySelector("img, picture, a"));
    const ctaLinks = Array.from(contentRoot.querySelectorAll('a.button-main, a[class*="button"], .cta-margin-header a, a[href]')).filter((a) => !a.closest(".foreground-image-mobile, .header-foreground-image")).filter((a, i, arr) => arr.indexOf(a) === i).filter((a) => hasText(a) || a.querySelector("img, picture"));
    if (!heading && paragraphs.length === 0 && ctaLinks.length === 0 && !bgImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    paragraphs.forEach((p) => contentCell.push(p));
    ctaLinks.forEach((a) => {
      if (!paragraphs.some((p) => p.contains(a))) contentCell.push(a);
    });
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-overlay", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-category.js
  function parse2(element, { document }) {
    const parent = element.parentElement;
    const tiles = parent ? Array.from(parent.querySelectorAll(":scope > .hover-tout")) : [element];
    if (tiles.length && tiles[0] !== element) {
      element.remove();
      return;
    }
    const groupTiles = tiles.length ? tiles : [element];
    const cells = [];
    groupTiles.forEach((tile) => {
      let img = tile.querySelector(".bg img, .has-bg img, img");
      if (img) {
        const realSrc = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-original") || img.getAttribute("data-lazy-src");
        if (realSrc) {
          img.setAttribute("src", realSrc);
        } else {
          const srcset = img.getAttribute("data-srcset") || img.getAttribute("srcset");
          if (srcset) img.setAttribute("src", srcset.split(",")[0].trim().split(" ")[0]);
        }
        if (!img.getAttribute("src")) img = null;
      }
      if (!img) {
        const pic = tile.querySelector(".bg picture, .has-bg picture, picture");
        if (pic && pic.querySelector("img[src], source[srcset]")) img = pic;
      }
      if (!img) {
        const bgCandidates = [tile, ...tile.querySelectorAll('.bg, .has-bg, [style*="background"]')];
        for (let i = 0; i < bgCandidates.length; i += 1) {
          const style = bgCandidates[i].getAttribute("style") || "";
          const m = style.match(/url\((['"]?)(.*?)\1\)/i);
          if (m && m[2]) {
            const synth = document.createElement("img");
            synth.setAttribute("src", m[2]);
            img = synth;
            break;
          }
        }
      }
      const textCell = [];
      const tileLink = tile.querySelector("a[href]");
      const href = tileLink ? tileLink.getAttribute("href") : null;
      const titleEl = tile.querySelector(".tout-title, h1, h2, h3, h4, h5, h6");
      const titleText = titleEl ? titleEl.textContent.trim() : "";
      if (titleText) {
        const h3 = document.createElement("h3");
        h3.textContent = titleText;
        textCell.push(h3);
      }
      const ctaBtn = tile.querySelector(".cta-container button, button, .cta-container a, a.button-main");
      const ctaText = ctaBtn ? ctaBtn.textContent.trim() : "";
      if (href && ctaText) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = ctaText;
        textCell.push(a);
      } else if (href && titleText && textCell.length) {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = "See Products";
        textCell.push(a);
      }
      if (img || textCell.length) {
        cells.push([img || "", textCell.length ? textCell : ""]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-category", cells });
    element.replaceWith(block);
    groupTiles.slice(1).forEach((t) => t.remove());
  }

  // tools/importer/parsers/widget.js
  var WIDGET_NAME_BY_CLASS = [
    { className: "driv-part-finder-main", name: "part-finder" },
    { className: "where-to-buy-link", name: "where-to-buy" }
  ];
  function resolveWidgetName(element) {
    const found = WIDGET_NAME_BY_CLASS.find(({ className }) => element.classList.contains(className) || element.querySelector(`.${className}`));
    return found ? found.name : "part-finder";
  }
  function parse3(element, { document }) {
    const widgetName = resolveWidgetName(element);
    const preserved = [];
    const heading = Array.from(element.querySelectorAll("h1, h2, h3")).find((h) => h.textContent.trim().length > 0);
    if (heading) {
      const h2 = document.createElement("h2");
      h2.textContent = heading.textContent.trim();
      preserved.push(h2);
    }
    let intro = element.querySelector("p");
    if (!intro || !intro.textContent.trim()) {
      intro = Array.from(element.querySelectorAll("h4, h5")).find((h) => /\b(find|near you|locator)\b/i.test(h.textContent)) || null;
    }
    if (intro && intro.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = intro.textContent.trim();
      preserved.push(p);
    }
    const link = document.createElement("a");
    link.href = `/widgets/${widgetName}.html`;
    link.textContent = `/widgets/${widgetName}.html`;
    const cells = [[link]];
    const block = WebImporter.Blocks.createBlock(document, { name: "widget", cells });
    preserved.forEach((node) => element.parentNode.insertBefore(node, element));
    element.replaceWith(block);
  }

  // tools/importer/transformers/moogparts-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function isMailingListAuthorable(payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections)) return false;
    return sections.some((section) => {
      const sel = section && section.selector || "";
      const defaults = section && section.defaultContent || [];
      const hasMailingSelector = sel.includes("mailing-list") || sel.includes("social-feed");
      const hasMailingDefault = Array.isArray(defaults) && defaults.some((d) => typeof d === "string" && (d.includes("mailing-list") || d.includes("social-feed")));
      return hasMailingSelector || hasMailingDefault;
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".skip-navigation",
        ".body-frame-side-content",
        // Mobile nav drawer body (region/language selector) - site chrome, not page content
        ".body-frame-global-content",
        ".global-mobile-nav",
        ".region-and-language",
        "header.global-header",
        "nav.page-site-nav-container",
        ".footer.section",
        "footer.page-footer-container",
        // Empty AEM embed placeholders left between hero blocks (no authorable content)
        ".embed-source",
        // Third-party / safe-to-strip elements
        "#rufous-sandbox",
        "iframe",
        "script",
        "noscript",
        "style",
        "link"
      ]);
      if (!isMailingListAuthorable(payload)) {
        WebImporter.DOMUtils.remove(element, [".social-feed"]);
      }
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("ng-app");
        el.removeAttribute("ng-controller");
        el.removeAttribute("ng-click");
        el.removeAttribute("ng-if");
        el.removeAttribute("ng-repeat");
        el.removeAttribute("ng-class");
        el.removeAttribute("onclick");
      });
    }
  }

  // tools/importer/transformers/moogparts-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.beforeTransform) return;
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const doc = element.ownerDocument;
    const resolved = sections.map((section) => {
      let el = null;
      if (section.selector) {
        try {
          el = element.querySelector(section.selector);
        } catch (e) {
          el = null;
        }
      }
      return { section, el };
    });
    for (let i = resolved.length - 1; i >= 0; i -= 1) {
      const { section, el } = resolved[i];
      if (!el) continue;
      if (section.style) {
        const block = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (el.parentNode) {
          el.parentNode.insertBefore(block, el.nextSibling);
        }
      }
      if (i > 0) {
        const hr = doc.createElement("hr");
        if (el.parentNode) {
          el.parentNode.insertBefore(hr, el);
        }
      }
    }
  }

  // tools/importer/import-parts-landing.js
  var PAGE_TEMPLATE = {
    name: "parts-landing",
    description: "MOOG Parts category landing page: hero banner with foreground image, 2x4 grid of part category tiles (Steering, Suspension, Driveline, Wheel End), and a Where to Buy / ZIP locator band.",
    urls: [
      "https://www.moogparts.com/parts.html"
    ],
    blocks: [
      {
        name: "hero-overlay",
        instances: [".header-foreground"]
      },
      {
        name: "cards-category",
        instances: [".hover-tout"]
      },
      {
        name: "widget",
        instances: [".where-to-buy-link"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "MOOG parts hero banner",
        selector: ".header-foreground",
        style: null,
        blocks: ["hero-overlay"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Part category tiles",
        selector: ".hover-tout",
        style: null,
        blocks: ["cards-category"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "Where to Buy ZIP locator",
        selector: ".where-to-buy-link",
        style: null,
        blocks: ["widget"],
        defaultContent: []
      }
    ]
  };
  var parsers = {
    "hero-overlay": parse,
    "cards-category": parse2,
    widget: parse3
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_parts_landing_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const pathname = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "");
      const path = WebImporter.FileUtils.sanitizePath(pathname || "/index");
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_parts_landing_exports);
})();
