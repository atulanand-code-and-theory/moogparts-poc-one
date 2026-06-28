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

  // tools/importer/import-technical-landing.js
  var import_technical_landing_exports = {};
  __export(import_technical_landing_exports, {
    default: () => import_technical_landing_default
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

  // tools/importer/parsers/columns-split.js
  var hasText2 = (el) => !!el && el.textContent.trim().length > 0;
  function buildTextCell(inner, document) {
    const parts = [];
    const heading = inner.querySelector("h1, h2, h3, h4, h5, h6");
    if (hasText2(heading)) parts.push(heading);
    inner.querySelectorAll("p").forEach((p) => {
      if (hasText2(p) || p.querySelector("img, a")) parts.push(p);
    });
    inner.querySelectorAll("a[href]").forEach((a) => {
      if (!hasText2(a) && !a.querySelector("img, picture")) return;
      if (!parts.some((node) => node.contains && node.contains(a))) parts.push(a);
    });
    return parts.length ? parts : "";
  }
  function parseTout(element, { document }) {
    const parent = element.parentElement;
    const touts = parent ? Array.from(parent.querySelectorAll(":scope > .tout")) : [element];
    if (touts.length && touts[0] !== element) {
      element.remove();
      return true;
    }
    const groupTouts = touts.length ? touts : [element];
    const cells = [];
    groupTouts.forEach((tout) => {
      const img = tout.querySelector(".tout-showcase .showcase-image img, .showcase-image img, .tout-showcase img, img");
      const content = tout.querySelector(".tout-content") || tout;
      const textCell = buildTextCell(content, document);
      if (img || Array.isArray(textCell) && textCell.length) {
        cells.push([img || "", textCell]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return true;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-split", cells });
    element.replaceWith(block);
    groupTouts.slice(1).forEach((t) => t.remove());
    return true;
  }
  function parse2(element, { document }) {
    if (element.classList.contains("tout")) {
      if (parseTout(element, { document })) return;
    }
    const cells = [];
    const grids = Array.from(element.querySelectorAll(".aem-Grid"));
    const rows = [];
    grids.forEach((grid) => {
      const cols = Array.from(grid.children).filter((child) => child.querySelector(":scope > .text-content, :scope .text-content") || child.querySelector(":scope .image, :scope > .image") || child.classList.contains("image") || child.classList.contains("fmmp-plaintext"));
      const textCols = cols.filter((c) => c.querySelector(".text-content") || c.classList.contains("fmmp-plaintext"));
      const imageCols = cols.filter((c) => (c.classList.contains("image") || c.querySelector(":scope > .image, :scope .image img")) && !c.querySelector(".text-content"));
      if (textCols.length >= 1 && imageCols.length >= 1 && cols.length >= 2) {
        rows.push(cols);
      }
    });
    rows.forEach((cols) => {
      const ordered = cols.slice().sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
      const rowCells = ordered.map((col) => {
        const isImage = col.classList.contains("image") || col.querySelector("img") && !col.querySelector(".text-content");
        if (isImage) {
          const img = col.querySelector("img");
          return img || "";
        }
        const inner = col.querySelector(".text-content") || col;
        return buildTextCell(inner, document);
      });
      while (rowCells.length < 2) rowCells.push("");
      const finalRow = rowCells.slice(0, 2);
      const hasContent = finalRow.some((cell) => Array.isArray(cell) && cell.length > 0 || cell && cell.nodeType);
      if (hasContent) cells.push(finalRow);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-split", cells });
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
      element.querySelectorAll(".article iframe[src]").forEach((iframe) => {
        const src = iframe.getAttribute("src") || "";
        if (!/(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i.test(src)) return;
        let href = src;
        if (href.startsWith("//")) href = `https:${href}`;
        const embedMatch = href.match(/\/embed\/([\w-]+)/);
        if (embedMatch) href = `https://www.youtube.com/watch?v=${embedMatch[1]}`;
        const a = element.ownerDocument.createElement("a");
        a.href = href;
        a.textContent = href;
        iframe.replaceWith(a);
      });
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
        // Empty AEM embed placeholders left between hero blocks (no authorable
        // content); also covers the leading empty placeholder on tech-tips.
        ".embed-source",
        // Presentational divider rules between touts (technical-landing) - not
        // authorable content, drop so they don't become stray default content.
        ".block-separator",
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
  function resolveSelector(root, selector) {
    if (!selector) return null;
    const candidates = Array.isArray(selector) ? selector : [selector];
    for (let c = 0; c < candidates.length; c += 1) {
      const sel = candidates[c];
      if (typeof sel === "string" && sel) {
        try {
          const found = root.querySelector(sel);
          if (found) return found;
        } catch (e) {
        }
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.beforeTransform) return;
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const doc = element.ownerDocument;
    const resolved = sections.map((section) => ({
      section,
      el: resolveSelector(element, section.selector)
    }));
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

  // tools/importer/import-technical-landing.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-overlay": parse,
    "columns-split": parse2
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
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
          pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_technical_landing_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
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
      return [{ element: main, path, report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) } }];
    }
  };
  return __toCommonJS(import_technical_landing_exports);
})();
