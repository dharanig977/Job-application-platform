import { NextResponse, type NextRequest } from "next/server";

// The whole app holds personal data, so every route sits behind one
// password (APP_PASSWORD). The browser shows its own sign-in prompt;
// any username works.
export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return new NextResponse("Server setup: APP_PASSWORD is not set.", { status: 500 });

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const supplied = atob(encoded).split(":").slice(1).join(":");
    if (supplied === password) return NextResponse.next();
  }
  return new NextResponse("Sign in required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Job Agent"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
