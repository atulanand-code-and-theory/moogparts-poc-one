const CATALOG_ORIGIN = 'https://www.moogparts.com/driv/partfinder';
const CROSS_SELL_ORIGIN = 'https://www.moogparts.com/content/loc-na/loc-us/fmmp-moog/en_US/find-my-part/find-my-part-results/jcr:content/main-par/cross_sell.by-tags';
const CACHE_TTL = 86400; // 1 day
const STRIP_PARAMS = new Set(['no_cache', 'nocache']);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function buildOriginUrl(base, incomingSearchParams) {
  const url = new URL(base);
  incomingSearchParams.forEach((value, key) => {
    if (!STRIP_PARAMS.has(key)) url.searchParams.set(key, value);
  });
  return url;
}

async function proxyWithCache(originUrl, ctx) {
  const cacheKey = new Request(originUrl.toString());
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) {
    // new Headers() is case-insensitive; plain object spread would duplicate CORS headers as '*, *'
    const headers = new Headers(cached.headers);
    headers.set('X-Cache', 'HIT');
    return new Response(cached.body, { status: cached.status, headers });
  }

  const upstream = await fetch(originUrl.toString());
  const headers = {
    ...CORS_HEADERS,
    'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    'X-Cache': 'MISS',
    ...(upstream.ok && { 'Cache-Control': `public, max-age=${CACHE_TTL}` }),
  };

  const response = new Response(upstream.body, { status: upstream.status, headers });
  if (upstream.ok) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, _env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    let originUrl;

    if (url.pathname.startsWith('/catalog/')) {
      const endpoint = url.pathname.slice('/catalog/'.length);
      if (!endpoint) return new Response('Not Found', { status: 404 });
      originUrl = buildOriginUrl(`${CATALOG_ORIGIN}/${endpoint}`, url.searchParams);
    } else if (url.pathname === '/cross-sell') {
      originUrl = buildOriginUrl(CROSS_SELL_ORIGIN, url.searchParams);
    } else {
      return new Response('Not Found', { status: 404 });
    }

    return proxyWithCache(originUrl, ctx);
  },
};
