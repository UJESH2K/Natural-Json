import { NextRequest } from "next/server";

export const runtime = "nodejs";

const REQUIRED = [
  "LIGHTER_BASE_URL",
  "LIGHTER_API_KEY_PUBLIC",
  "LIGHTER_API_KEY_PRIVATE",
  "LIGHTER_API_KEY_INDEX",
  "ETH_PRIVATE_KEY",
  "LIGHTER_WALLET_ADDRESS",
];

export async function GET(_req: NextRequest) {
  const present: Record<string, boolean> = {};
  const missing: string[] = [];
  for (const key of REQUIRED) {
    const has = !!process.env[key] && process.env[key] !== "";
    present[key] = has;
    if (!has) missing.push(key);
  }
  return new Response(
    JSON.stringify({ ok: true, present, missing, allPresent: missing.length === 0 }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
