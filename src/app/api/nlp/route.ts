import { NextRequest, NextResponse } from "next/server";
import { Workflow } from "@/types/workflow";
import { parseWorkflowLocally } from "@/lib/localParser";
import { parseWorkflowWithGemini } from "@/lib/gemini";

// Store the last parsed workflow in memory (persists while server is running)
let lastWorkflow: Workflow | null = null;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt");
  
  // If a prompt is provided via query param, parse it
  if (prompt && typeof prompt === "string") {
    try {
      let workflow = await parseWorkflowWithGemini(prompt);
      if (!workflow) {
        workflow = parseWorkflowLocally(prompt);
      }
      if (!workflow) {
        return NextResponse.json({ error: "Failed to parse workflow" }, { status: 500 });
      }
      // Save it as the last workflow
      lastWorkflow = workflow;
      return NextResponse.json(workflow);
    } catch (err: any) {
      console.error("Error in GET /api/nlp:", err);
      return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
    }
  }

  // No prompt — return the last parsed workflow (from UI POST or previous GET)
  if (lastWorkflow) {
    return NextResponse.json(lastWorkflow);
  }

  // No workflow yet
  return NextResponse.json({ error: "No workflow yet. Submit a prompt first." }, { status: 404 });
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Try Gemini first if available
    let workflow: Workflow | null = await parseWorkflowWithGemini(prompt);

    // Fallback to local parser if Gemini fails or is not configured
    if (!workflow) {
      console.log("Falling back to local parser");
      workflow = parseWorkflowLocally(prompt);
    }

    // Save as last workflow so GET /api/nlp returns it
    lastWorkflow = workflow;

    // Return the workflow object directly (no wrapper)
    return NextResponse.json(workflow);
  } catch (error: any) {
    console.error("Error parsing workflow:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse workflow" },
      { status: 500 }
    );
  }
}
