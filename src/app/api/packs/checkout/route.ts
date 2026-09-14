import { NextRequest, NextResponse } from "next/server";
import { startPackCheckout } from "@/app/packs/checkout/actions";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  // Preserve the same-origin protection previously provided by Server Actions.
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid checkout request." },
      { status: 403, headers },
    );
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid checkout request." },
      { status: 400, headers },
    );
  }
  // A JSON response sets the checkout cookies without re-rendering the cart.
  const result = await startPackCheckout(input);
  return NextResponse.json(result, {
    status: result.error ? 400 : 200,
    headers,
  });
}
