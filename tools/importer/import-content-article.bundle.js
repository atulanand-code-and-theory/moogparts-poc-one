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

  // tools/importer/import-content-article.js
  var import_content_article_exports = {};
  __export(import_content_article_exports, {
    default: () => import_content_article_default
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
  function parseProductFeature(element, { document }) {
    const headline = element.querySelector(".product-feature-title h1, .product-feature-title h2, .product-feature-title h3");
    let bases = Array.from(element.querySelectorAll(".product-feature-base"));
    if (bases.length === 0) bases = [element];
    const cells = [];
    bases.forEach((base) => {
      const img = base.querySelector(".product-feature-image img, .image img, img");
      const content = base.querySelector(".product-feature-content") || base;
      const textCell = [];
      const heading = content.querySelector("h1, h2, h3, h4, h5, h6");
      if (hasText2(heading)) textCell.push(heading);
      content.querySelectorAll("ul, ol").forEach((list) => {
        if (hasText2(list)) textCell.push(list);
      });
      content.querySelectorAll(":scope > p").forEach((p) => {
        if (hasText2(p)) textCell.push(p);
      });
      content.querySelectorAll("a.cta-link, .ctas a[href]").forEach((a) => {
        if (a.closest(".buy-online-toolbox")) return;
        if (!hasText2(a) && !a.querySelector("img, picture")) return;
        if (textCell.some((node) => node.contains && node.contains(a))) return;
        textCell.push(a);
      });
      if (img || textCell.length) {
        cells.push([img || "", textCell.length ? textCell : ""]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return true;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-split", cells });
    if (hasText2(headline)) {
      const h2 = document.createElement("h2");
      h2.textContent = headline.textContent.trim();
      element.parentNode.insertBefore(h2, element);
    }
    element.replaceWith(block);
    return true;
  }
  function parse2(element, { document }) {
    if (element.classList.contains("product-feature") || element.querySelector(".product-feature-base, .product-feature-content")) {
      if (parseProductFeature(element, { document })) return;
    }
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

  // tools/importer/parsers/widget.js
  var WIDGET_NAME_BY_CLASS = [
    { className: "driv-part-finder-main", name: "part-finder" },
    { className: "ymm-search", name: "part-finder" },
    // Both the parts-page ZIP locator (`.where-to-buy-link`) and the standalone
    // where-to-buy page's full search widget (`.where-to-buy-search`) resolve to
    // the same `/widgets/where-to-buy.*` asset.
    { className: "where-to-buy-link", name: "where-to-buy" },
    { className: "where-to-buy-search", name: "where-to-buy" },
    { className: "search-files", name: "search-files" },
    { className: "diagnostic-center", name: "diagnostic-center" },
    { className: "documents-autocomplete", name: "documents-autocomplete" }
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

  // tools/importer/import-content-article.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-overlay": parse,
    "columns-split": parse2,
    widget: parse3
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
  var import_content_article_default = {
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
  return __toCommonJS(import_content_article_exports);
})();
