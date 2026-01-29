// Cloudflare Worker: CORS Proxy for DBA.dk API
// Deploy: npx wrangler deploy cors-proxy-worker.js --name dba-cors-proxy

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing ?url= parameter", { status: 400 });
    }

    // Only allow proxying to dba.dk
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith("dba.dk")) {
      return new Response("Only dba.dk is allowed", { status: 403 });
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
      });

      const body = await response.text();

      return new Response(body, {
        status: response.status,
        headers: {
          ...corsHeaders(),
          "Content-Type": response.headers.get("Content-Type") || "application/json",
        },
      });
    } catch (err) {
      return new Response("Proxy error: " + err.message, { status: 502 });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
