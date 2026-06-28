import { loadCSS } from '../../scripts/aem.js';

/**
 * Parses a widget href into folder path and name.
 * @param {string} pathname URL pathname (e.g. `/widgets/path1/name.html`)
 * @returns {{ widgetPath: string, widgetName: string }}
 */
function parseWidgetHref(pathname) {
  const pathSegments = pathname.split('/').filter((p) => p);
  const widgetName = pathSegments[pathSegments.length - 1].split('.')[0];
  const widgetPath = pathSegments.slice(1, -1).join('/');
  return { widgetPath, widgetName };
}

/**
 * Builds a widget asset URL.
 * @param {string} widgetPath Folder path under `/widgets/`
 * @param {string} widgetName Widget file name without extension
 * @param {string} extension File extension (`html`, `css`, `js`)
 */
function widgetUrl(widgetPath, widgetName, extension) {
  const prefix = widgetPath ? `${widgetPath}/` : '';
  return `${window.hlx.codeBasePath}/widgets/${prefix}${widgetName}.${extension}`;
}

/**
 * Loads and decorates a widget block.
 * @param {Element} widget The widget block element
 */
export default async function decorate(widget) {
  const source = widget.querySelector('a[href]');
  const { pathname, searchParams } = new URL(source.href);
  const { widgetPath, widgetName } = parseWidgetHref(pathname);

  try {
    const resp = await fetch(widgetUrl(widgetPath, widgetName, 'html'));
    if (!resp.ok) {
      // Runtime widget asset is not available in this environment (e.g. local
      // EDS preview). Leave the placeholder frame in place rather than
      // injecting an error document, and mark the block so the frame can be
      // styled/contained gracefully.
      throw new Error(`widget asset not found (${resp.status})`);
    }
    const html = await resp.text();
    // Guard against a soft 404 that returns a full HTML document instead of a
    // fragment — injecting <html>/<head>/<header>/<footer> would break layout.
    if (/<html[\s>]|<!doctype/i.test(html)) {
      throw new Error('widget asset returned a full document, not a fragment');
    }
    widget.innerHTML = html;

    const cssLoaded = loadCSS(widgetUrl(widgetPath, widgetName, 'css'));
    const decorationComplete = (async () => {
      const mod = await import(widgetUrl(widgetPath, widgetName, 'js'));
      if (mod.default) await mod.default(widget);
    })();
    await Promise.all([cssLoaded, decorationComplete]);

    widget.classList.add(widgetName);
    widget.classList.remove('block');
    widget.dataset.source = source.href;
    searchParams.forEach((value, key) => {
      widget.dataset[key] = value;
    });

    const wrapper = widget.closest('.widget-wrapper');
    if (wrapper) {
      wrapper.classList.add(`${widgetName}-wrapper`);
      wrapper.classList.remove('widget-wrapper');
    }
    const container = widget.closest('.widget-container');
    if (container) {
      container.classList.add(`${widgetName}-container`);
      container.classList.remove('widget-container');
    }
  } catch (error) {
    // Asset unavailable: keep the placeholder frame and flag it so the section
    // framing still renders correctly without a broken/injected document.
    widget.innerHTML = '';
    widget.classList.add(widgetName, 'widget-unavailable');
    widget.classList.remove('block');
    const wrapper = widget.closest('.widget-wrapper');
    if (wrapper) {
      wrapper.classList.add(`${widgetName}-wrapper`);
      wrapper.classList.remove('widget-wrapper');
    }
    const container = widget.closest('.widget-container');
    if (container) {
      container.classList.add(`${widgetName}-container`);
      container.classList.remove('widget-container');
    }
    // eslint-disable-next-line no-console
    console.warn(`widget "${widgetPath}/${widgetName}" asset unavailable; rendering placeholder frame`, error);
  }
}
