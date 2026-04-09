import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { system, messages, maxTokens } = await req.json();

    if (!system || !messages) {
      return NextResponse.json(
        { error: { message: "Missing required fields: system, messages" } },
        { status: 400 }
      );
    }

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens || 2000,
      system,
      messages,
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: { message: err.message || "Internal server error" } },
      { status: err.status || 500 }
    );
  }
}
