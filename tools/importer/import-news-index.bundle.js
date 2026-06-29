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

  // tools/importer/import-news-index.js
  var import_news_index_exports = {};
  __export(import_news_index_exports, {
    default: () => import_news_index_default
  });

  // tools/importer/parsers/hero-overlay.js
  var normalizeText = (s) => (s || "").replace(/[\s ​‌‍﻿]+/g, "");
  var hasText = (el) => normalizeText(el.textContent).length > 0;
  function parse(element, { document }) {
    const bgContainer = element.querySelector(".header-hero-background") || element.querySelector('[class*="background"]') || element.querySelector(":scope > .has-bg, :scope > div > .has-bg");
    const isUsableBgImg = (img) => img && !img.closest(".foreground-image-mobile, .header-foreground-image") && !img.classList.contains("cq-image-placeholder") && !/\/0\.gif(\?|$)/i.test(img.getAttribute("src") || "");
    let bgImage = null;
    if (bgContainer) {
      const directImg = bgContainer.querySelector(":scope > img");
      if (isUsableBgImg(directImg)) {
        bgImage = directImg;
      } else {
        const descendantImg = Array.from(bgContainer.querySelectorAll("img")).find((img) => isUsableBgImg(img));
        if (descendantImg) bgImage = descendantImg;
      }
      if (!bgImage) {
        const pic = bgContainer.querySelector("picture");
        if (pic && !pic.closest(".foreground-image-mobile, .header-foreground-image")) {
          bgImage = pic;
        }
      }
      if (!bgImage) {
        const style = bgContainer.getAttribute("style") || "";
        const m = style.match(/background(?:-image)?\s*:\s*[^;]*url\((['"]?)(.*?)\1\)/i);
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

  // tools/importer/parsers/cards-article.js
  function parseCrossSell(element, { document }) {
    const items = Array.from(element.querySelectorAll(".cross-sell-item"));
    const cells = [];
    items.forEach((item) => {
      const imgEl = item.querySelector(".image img, img");
      const imgSrc = imgEl ? imgEl.getAttribute("src") || "" : "";
      const img = imgEl && imgSrc && !/\{\{/.test(imgSrc) ? imgEl : null;
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
      const ctaHref = cta ? cta.getAttribute("href") || "" : "";
      if (cta && cta.textContent.trim() && ctaHref && !/\{\{/.test(ctaHref)) {
        const a = document.createElement("a");
        a.href = ctaHref;
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
  function parseToutCards(element, { document }) {
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
      const textCell = [];
      const title = content.querySelector("h1, h2, h3, h4, h5, h6");
      if (title && title.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = title.textContent.trim();
        textCell.push(h3);
      }
      const desc = content.querySelector("p");
      if (desc && desc.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        textCell.push(p);
      }
      const cta = content.querySelector(".tout-cta a[href], a.button-main[href], a.button-arrow[href]");
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
    groupTouts.slice(1).forEach((t) => t.remove());
    return true;
  }
  function parseTimeline(element, { document }) {
    const items = Array.from(element.querySelectorAll(".timeline-item"));
    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector(".timeline-showcase img, img");
      const textCell = [];
      const yearEl = item.querySelector("h2");
      const yearText = yearEl ? yearEl.textContent.replace(/\s+/g, " ").trim() : "";
      if (yearText) {
        const h3 = document.createElement("h3");
        h3.textContent = yearText;
        textCell.push(h3);
      }
      const titleEl = item.querySelector("h4, h3:not(:first-of-type)");
      if (titleEl && titleEl.textContent.trim()) {
        const h4 = document.createElement("h4");
        h4.innerHTML = titleEl.innerHTML;
        textCell.push(h4);
      }
      const copy = item.querySelector(".timeline-item-copy");
      if (copy) {
        Array.from(copy.querySelectorAll("p")).filter((p) => p.textContent.trim()).forEach((p) => textCell.push(p));
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
  function parseCarousel(element, { document }) {
    if (element.parentElement && element.parentElement.closest(".carousel-container")) {
      element.remove();
      return true;
    }
    const allSlides = Array.from(element.querySelectorAll(".tout-slide"));
    const seen = /* @__PURE__ */ new Set();
    const slides = allSlides.filter((slide) => {
      const ordinal = Array.from(slide.classList).find((c) => /^slide\d+$/.test(c));
      const key = ordinal || `idx-${allSlides.indexOf(slide)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".tout-image .preview-img, .tout-image img, img.preview-img, img");
      const textCell = [];
      const titleP = slide.querySelector(".tout-content .content p, .tout-content p, .content p");
      if (titleP && titleP.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = titleP.textContent.replace(/\s+/g, " ").trim();
        textCell.push(h3);
      }
      const cta = slide.querySelector(".slide-cta a[href], a.button-main[href], a.button-arrow[href]");
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
    if (element.classList.contains("timeline") || element.querySelector(".timeline-item")) {
      if (parseTimeline(element, { document })) return;
    }
    if (element.classList.contains("carousel-container") || element.querySelector(".tout-slide")) {
      if (parseCarousel(element, { document })) return;
    }
    if (element.classList.contains("tout")) {
      if (parseToutCards(element, { document })) return;
    }
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
        // Parts-specific chrome (parts-category / parts-product), verified in
        // /parts/steering/idler-arms.html cleaned.html:
        //   - retailer "Buy Now" popup nested in product-feature CTAs; leaks
        //     retailer links into the columns-split block (authorable "Get it
        //     Installed" / "Buy in Store" CTAs + "Buy Now" button text kept).
        //   - "Tech Tips" random-tip teaser widget after the YMM finder; JS-
        //     driven, not in any mapped section, leaks a stray heading + button.
        ".buy-online-toolbox",
        ".random-tip",
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

  // tools/importer/import-news-index.js
  var PAGE_TEMPLATE = {
    "name": "news-index",
    "description": "MOOG News index: H1 title, a featured-news promo, and an article-teaser card grid (date + title + excerpt + Read More) with View More.",
    "urls": [
      "https://www.moogparts.com/moognews.html"
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
        "name": "cards-article",
        "instances": [
          ".ledes"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "News title",
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
        "name": "News article grid",
        "selector": ".ledes",
        "style": "grey",
        "blocks": [
          "cards-article"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "hero-overlay": parse,
    "cards-article": parse2
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn.call(null, hookName, element, enhancedPayload);
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
  var import_news_index_default = {
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
  return __toCommonJS(import_news_index_exports);
})();
