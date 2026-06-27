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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-overlay.js
  function parse(element, { document }) {
    const bgContainer = element.querySelector('.header-hero-background, [class*="background"]');
    let bgImage = null;
    if (bgContainer) {
      bgImage = bgContainer.querySelector("img");
      if (!bgImage) {
        const pic = bgContainer.querySelector("picture");
        if (pic) bgImage = pic;
      }
      if (!bgImage) {
        const style = bgContainer.getAttribute("style") || "";
        const m = style.match(/url\((['"]?)(.*?)\1\)/i);
        if (m && m[2]) {
          const img = document.createElement("img");
          img.src = m[2];
          bgImage = img;
        }
      }
    }
    const contentRoot = element.querySelector(".header-hero-content, .header-hero-content-container") || element;
    const heading = Array.from(contentRoot.querySelectorAll("h1, h2, h3, h4, h5, h6")).find((h) => h.textContent.trim().length > 0) || null;
    const paragraphs = Array.from(contentRoot.querySelectorAll("p")).filter((p) => p.textContent.trim().length > 0 || p.querySelector("img, picture, a"));
    const ctaLinks = Array.from(contentRoot.querySelectorAll('a.button-main, a[class*="button"], .cta-margin-header a, a')).filter((a, i, arr) => arr.indexOf(a) === i).filter((a) => a.textContent.trim().length > 0 || a.querySelector("img, picture"));
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

  // tools/importer/parsers/widget.js
  function parse2(element, { document }) {
    const widgetName = "part-finder";
    const link = document.createElement("a");
    link.href = `/widgets/${widgetName}.html`;
    link.textContent = `/widgets/${widgetName}.html`;
    const cells = [[link]];
    const block = WebImporter.Blocks.createBlock(document, { name: "widget", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-split.js
  function parse3(element, { document }) {
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
        const parts = [];
        const heading = inner.querySelector("h1, h2, h3, h4, h5, h6");
        if (heading) parts.push(heading);
        inner.querySelectorAll("p").forEach((p) => {
          if (p.textContent.trim().length > 0 || p.querySelector("img, a")) parts.push(p);
        });
        inner.querySelectorAll("a").forEach((a) => {
          if (!parts.some((node) => node.contains && node.contains(a))) parts.push(a);
        });
        return parts.length ? parts : "";
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

  // tools/importer/parsers/cards-article.js
  function parse4(element, { document }) {
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

  // tools/importer/parsers/cards-category.js
  function parse5(element, { document }) {
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
        const bgEl = tile.querySelector(".bg, .has-bg") || tile;
        const style = bgEl.getAttribute("style") || "";
        const m = style.match(/url\((['"]?)(.*?)\1\)/i);
        if (m && m[2]) {
          const synth = document.createElement("img");
          synth.src = m[2];
          img = synth;
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

  // tools/importer/transformers/moogparts-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "MOOG Parts homepage: hero banners, part finder, blue bulletins/diagnostic band, article ledes, category tiles, mailing list CTA",
    urls: [
      "https://www.moogparts.com/"
    ],
    blocks: [
      {
        name: "hero-overlay",
        instances: [
          ".header-hero:nth-of-type(1) .header-hero-container",
          ".header-hero:nth-of-type(2) .header-hero-container"
        ]
      },
      {
        name: "widget",
        instances: [".driv-part-finder-main"]
      },
      {
        name: "columns-split",
        instances: ["#page-content .responsivegrid .aem-Grid--12 > .responsivegrid:has(.text-content)"]
      },
      {
        name: "cards-article",
        instances: [".ledes .ledes-container"]
      },
      {
        name: "cards-category",
        instances: [".hover-tout"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Problem Solver Technologies hero",
        selector: ".header-hero:nth-of-type(1) .header-hero-container",
        style: null,
        blocks: ["hero-overlay"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Find My Part finder",
        selector: ".driv-part-finder-main",
        style: "light",
        blocks: ["widget"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "Excellence Never Quits hero",
        selector: ".header-hero:nth-of-type(2) .header-hero-container",
        style: null,
        blocks: ["hero-overlay"],
        defaultContent: []
      },
      {
        id: "section-4",
        name: "Bulletins + Diagnostic Center",
        selector: "#page-content .responsivegrid .aem-Grid--12 > .responsivegrid:has(.text-content)",
        style: "blue",
        blocks: ["columns-split"],
        defaultContent: []
      },
      {
        id: "section-5",
        name: "Parts Matter article ledes",
        selector: ".ledes .ledes-container",
        style: "grey",
        blocks: ["cards-article"],
        defaultContent: []
      },
      {
        id: "section-6",
        name: "Product category tiles",
        selector: ".hover-tout",
        style: null,
        blocks: ["cards-category"],
        defaultContent: []
      },
      {
        id: "section-7",
        name: "Mailing list CTA",
        selector: ".social-feed .mailing-list",
        style: "yellow",
        blocks: [],
        defaultContent: [".social-feed .mailing-list"]
      }
    ]
  };
  var parsers = {
    "hero-overlay": parse,
    widget: parse2,
    "columns-split": parse3,
    "cards-article": parse4,
    "cards-category": parse5
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
  var import_homepage_default = {
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
  return __toCommonJS(import_homepage_exports);
})();
