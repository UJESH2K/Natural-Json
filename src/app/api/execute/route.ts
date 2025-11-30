import { NextRequest } from "next/server";
import { executeWorkflow } from "@/lib/executor";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflow, provider = "backpack" } = body || {};
    if (!workflow) {
      return new Response(JSON.stringify({ ok: false, error: "Missing workflow" }), { status: 400 });
    }

    const events: any[] = [];
    const results = await executeWorkflow(workflow, {
      provider,
      onEvent: (e) => events.push({ ...e, ts: Date.now() }),
    });

    return new Response(JSON.stringify({ ok: true, results, events }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Unknown error" }), { status: 500 });
  }
}
