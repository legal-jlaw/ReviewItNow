import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

const PRICES: Record<string, { amount: number; name: string }> = {
  analyze: { amount: 2900, name: "ReviewItNow Analyze" },
  redline: { amount: 9900, name: "ReviewItNow Redline" },
};

export async function POST(req: NextRequest) {
  try {
    const { tier, fileName } = await req.json();

    const price = PRICES[tier];
    if (!price) {
      return NextResponse.json(
        { error: "Invalid tier" },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: price.name,
              description: `AI contract review — ${tier} tier for ${fileName || "document"}`,
            },
            unit_amount: price.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}`,
      metadata: {
        tier,
        fileName: fileName || "unknown",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
