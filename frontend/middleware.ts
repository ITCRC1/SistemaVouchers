import { NextRequest, NextResponse } from "next/server";

const SSO_BASE = "https://apps.thecostaricacollection.com";
const COOKIE_NAME = "crc_sso";

export function middleware(request: NextRequest) {
  if (request.cookies.has(COOKIE_NAME)) {
    return NextResponse.next();
  }
  const next = encodeURIComponent(request.nextUrl.toString());
  return NextResponse.redirect(`${SSO_BASE}/api/sso/refresh?next=${next}`);
}

export const config = {
  matcher: [
    // Deja fuera del guardia SSO:
    //  - /_next y favicon.ico: internos de Next, no páginas de producto.
    //  - /api/*: el proxy hacia el backend — el guardia SSO del backend ya lo protege
    //    (sso_guard.py); si además lo bloqueamos aquí, el fetch nunca llegaría a
    //    decidir 401 vs 200 y perderíamos el manejo fino que ya existe ahí.
    //  - /v/*: página pública de voucher por QR (frontend/app/v/[consecutive]),
    //    usada por huéspedes/proveedores sin sesión corporativa — ver auditoría.
    "/((?!_next|favicon.ico|api/|v/).*)",
  ],
};
