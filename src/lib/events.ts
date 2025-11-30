import { EventEmitter } from "events";

type EventPayload = { type: string; workflowId?: string; [k: string]: any };

class WorkflowEventBus {
  private emitter = new EventEmitter();

  publish(event: EventPayload) {
    const id = event.workflowId || "global";
    this.emitter.emit(id, { ...event, ts: Date.now() });
  }

  subscribe(workflowId: string, handler: (e: EventPayload) => void) {
    const id = workflowId || "global";
    this.emitter.on(id, handler);
    return () => this.emitter.off(id, handler);
  }
}

export const eventsBus = new WorkflowEventBus();
