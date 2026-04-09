"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "analyze";
  const sessionId = searchParams.get("session_id") || "";

  const tierLabel = tier === "redline" ? "Redline" : "Analyze";
  const tierDesc =
    tier === "redline"
      ? "Full analysis + tracked changes in your DOCX"
      : "Full clause-by-clause analysis with negotiation playbook";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAF9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "48px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#1A3A5C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5L19 7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1A1714",
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          Payment successful
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#6B6560",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Your <strong style={{ color: "#1A3A5C" }}>{tierLabel}</strong> tier is
          unlocked. {tierDesc}.
        </p>

        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 8,
            background: "#1A3A5C",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
        >
          Back to ReviewItNow
        </a>

        {sessionId && (
          <div
            style={{
              marginTop: 24,
              fontSize: 11,
              color: "#9E9890",
              fontFamily: "ui-monospace, 'SF Mono', monospace",
            }}
          >
            Session: {sessionId}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif",
            color: "#6B6560",
          }}
        >
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
