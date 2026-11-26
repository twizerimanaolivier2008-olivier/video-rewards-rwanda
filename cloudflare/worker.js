const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
};

function withHeaders(response, additions = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  for (const [name, value] of Object.entries(additions)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getApiOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);

    if (incoming.pathname === "/api" || incoming.pathname.startsWith("/api/")) {
      const origin = getApiOrigin(env.API_ORIGIN);
      if (!origin) {
        return withHeaders(new Response(
          JSON.stringify({ error: "API origin is not configured. Contact the administrator." }),
          { status: 503, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }
        ), { "Cache-Control": "no-store" });
      }

      const target = new URL(incoming.pathname + incoming.search, origin);
      const headers = new Headers(request.headers);
      headers.set("X-Forwarded-Host", incoming.host);
      headers.set("X-Forwarded-Proto", "https");\n      // The incoming CF-Connecting-IP value is supplied by Cloudflare at the edge.\n      const clientIp = request.headers.get("CF-Connecting-IP");\n      if (clientIp) headers.set("X-Client-IP", clientIp);\n      else headers.delete("X-Client-IP");
      const accessId = env.API_ACCESS_CLIENT_ID;
      const accessSecret = env.API_ACCESS_CLIENT_SECRET;
      if (Boolean(accessId) !== Boolean(accessSecret)) {
        return withHeaders(new Response(
          JSON.stringify({ error: "API Access service token is incomplete." }),
          { status: 503, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }
        ), { "Cache-Control": "no-store" });
      }
      if (accessId && accessSecret) {
        headers.set("CF-Access-Client-Id", accessId);
        headers.set("CF-Access-Client-Secret", accessSecret);
      }
      headers.delete("Host");
      const init = {
        method: request.method,
        headers,
        redirect: "manual",
      };
      if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;

      try {
        const upstream = await fetch(new Request(target, init));
        return withHeaders(upstream, { "Cache-Control": "no-store" });
      } catch {
        return withHeaders(new Response(
          JSON.stringify({ error: "The API is temporarily unavailable." }),
          { status: 502, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }
        ), { "Cache-Control": "no-store" });
      }
    }

    const asset = await env.ASSETS.fetch(request);
    return withHeaders(asset);
  },
};
