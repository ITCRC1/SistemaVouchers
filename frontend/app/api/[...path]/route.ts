import { NextRequest, NextResponse } from "next/server";

// Proxy same-origin /api/* to the backend, forwarding the Cookie header
// (Next's rewrites() strip Cookie on external destinations — verified locally —
// so this Route Handler forwards it explicitly instead).
const BACKEND_URL = (process.env.BACKEND_URL ?? "https://sistema-vouchers-backend-production.up.railway.app").replace(/\/$/, "");

// Headers that must not be copied verbatim between hops: either they describe
// the transport of THIS hop (connection/host) or describe a body encoding that
// changes once fetch() decompresses/re-serializes the response.
const HOP_BY_HOP = new Set([
  "connection", "content-encoding", "content-length", "transfer-encoding",
  "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "upgrade", "host",
]);

async function proxy(request: NextRequest): Promise<NextResponse> {
  const target = `${BACKEND_URL}${request.nextUrl.pathname}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = !["GET", "HEAD"].includes(request.method);

  const backendRes = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    ...(hasBody ? { duplex: "half" as const } : {}),
    redirect: "follow",
  });

  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) resHeaders.set(key, value);
  });

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
