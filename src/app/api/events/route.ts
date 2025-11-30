import { NextRequest } from "next/server";
import { eventsBus } from "@/lib/events";

export const runtime = "nodejs";

// Server-Sent Events for live workflow updates with guarded controller
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get("workflowId") || "global";

  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const enc = (data: any) => `data: ${JSON.stringify(data)}\n\n`;
      const safeSend = (data: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(enc(data)));
        } catch (err) {
          closed = true;
          try { controller.close(); } catch {}
        }
      };

      // Initial greeting
      safeSend({ type: "hello", workflowId, ts: Date.now() });

      // Subscribe to event bus
      const unsubscribe = eventsBus.subscribe(workflowId, (e) => safeSend(e));

      // Heartbeat every 5s
      const heartbeat = setInterval(() => {
        safeSend({ type: "heartbeat", workflowId, ts: Date.now() });
      }, 5000);

      const close = () => {
        if (closed) return;
        closed = true;
        try { unsubscribe(); } catch {}
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      };

      // Abort / client disconnect handling (Next.js might not always provide signal yet)
      try {
        // @ts-ignore access internal signal if available
        const signal: AbortSignal | undefined = (req as any).signal;
        if (signal) {
          signal.addEventListener("abort", close);
        }
      } catch {}

      // Auto-close after 5 minutes
      setTimeout(close, 300000);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
