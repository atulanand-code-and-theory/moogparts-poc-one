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

  // tools/importer/import-technical-tool.js
  var import_technical_tool_exports = {};
  __export(import_technical_tool_exports, {
    default: () => import_technical_tool_default
  });

  // tools/importer/parsers/widget.js
  var WIDGET_NAME_BY_CLASS = [
    { className: "driv-part-finder-main", name: "part-finder" },
    { className: "where-to-buy-link", name: "where-to-buy" },
    { className: "search-files", name: "search-files" },
    { className: "diagnostic-center", name: "diagnostic-center" },
    { className: "documents-autocomplete", name: "documents-autocomplete" }
  ];
  function resolveWidgetName(element) {
    const found = WIDGET_NAME_BY_CLASS.find(({ className }) => element.classList.contains(className) || element.querySelector(`.${className}`));
    return found ? found.name : "part-finder";
  }
  function parse(element, { document }) {
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

  // tools/importer/parsers/cards-article.js
  function parseCrossSell(element, { document }) {
    const items = Array.from(element.querySelectorAll(".cross-sell-item"));
    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector(".image img, img");
      const textCell = [];
      const title = item.querySelector("h3, h2, .cross-sell-title");
      if (title && title.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = title.textContent.trim();
        textCell.push(h3);
      }
      const desc = item.querySelector("p");
      if (desc && desc.textContent.trim()) textCell.push(desc);
      const cta = item.querySelector("a[href]");
      if (cta && cta.textContent.trim()) {
        const a = document.createElement("a");
        a.href = cta.getAttribute("href") || "#";
        a.textContent = cta.textContent.replace(/\s+/g, " ").trim();
        textCell.push(a);
      }
      if (img || textCell.length) {
        cells.push([img || "", textCell.length ? textCell : ""]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return true;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
    element.replaceWith(block);
    return true;
  }
  function parse2(element, { document }) {
    if (element.classList.contains("cross-sell") || element.querySelector(".cross-sell-item")) {
      if (parseCrossSell(element, { document })) return;
    }
    const cards = Array.from(element.querySelectorAll(".lede"));
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector(".lede-image img, figure img, img");
      const textCell = [];
      const titleLink = card.querySelector("a.lede-title, .lede-title");
      if (titleLink && titleLink.textContent.trim()) {
        const h3 = document.createElement("h3");
        const a = document.createElement("a");
        a.href = titleLink.getAttribute("href") || "#";
        a.textContent = titleLink.textContent.trim();
        h3.appendChild(a);
        textCell.push(h3);
      }
      const teaser = card.querySelector("p.lede-teaser-text, .lede-teaser p, p");
      if (teaser && teaser.textContent.trim()) textCell.push(teaser);
      const cta = card.querySelector("a.cta-link, .lede-teaser a.lede-teaser-cta");
      if (cta && cta.textContent.trim()) textCell.push(cta);
      if (img || textCell.length) {
        cells.push([img || "", textCell.length ? textCell : ""]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
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

  // tools/importer/import-technical-tool.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    widget: parse,
    "cards-article": parse2
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
  var import_technical_tool_default = {
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
  return __toCommonJS(import_technical_tool_exports);
})();
