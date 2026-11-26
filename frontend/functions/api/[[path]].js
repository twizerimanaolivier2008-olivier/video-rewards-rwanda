const headersToAdd = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

export async function onRequest({ request, env }) {
  let origin;
  try {
    origin = new URL(env.API_ORIGIN || "");
  } catch {
    return new Response(JSON.stringify({
      error: "The API has not been connected yet. The website preview is available, but account and payment features are offline.",
      code: "API_ORIGIN_NOT_CONFIGURED",
    }), {
      status: 503,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...headersToAdd,
      },
    });
  }

  if (origin.protocol !== "https:" || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash) {
    return new Response(JSON.stringify({ error: "API origin configuration is invalid." }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headersToAdd },
    });
  }

  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, origin);
  const headers = new Headers(request.headers);
  headers.set("X-Forwarded-Host", incoming.host);
  headers.set("X-Forwarded-Proto", "https");
  if (env.API_ACCESS_CLIENT_ID && env.API_ACCESS_CLIENT_SECRET) {
    headers.set("CF-Access-Client-Id", env.API_ACCESS_CLIENT_ID);
    headers.set("CF-Access-Client-Secret", env.API_ACCESS_CLIENT_SECRET);
  }
  headers.delete("Host");

  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = request.body;

  try {
    const upstream = await fetch(new Request(target, init));
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("Cache-Control", "no-store");
    for (const [name, value] of Object.entries(headersToAdd)) responseHeaders.set(name, value);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return new Response(JSON.stringify({ error: "The API is temporarily unavailable." }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headersToAdd },
    });
  }
}
