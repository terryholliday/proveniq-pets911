import { NextRequest, NextResponse } from 'next/server';

// Stripe integration - requires STRIPE_SECRET_KEY env variable
// For PROVENIQ Foundation 501(c)(3), create new Stripe account at:
// https://dashboard.stripe.com/register

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, isMonthly, donorName, donorEmail, dedication } = body;

    // Validate
    if (!amount || amount < 5) {
      return NextResponse.json(
        { error: 'Minimum donation is $5' },
        { status: 400 }
      );
    }

    if (!donorEmail) {
      return NextResponse.json(
        { error: 'Email is required for donation receipt' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.log('Stripe not configured - returning setup instructions');
      return NextResponse.json({
        error: 'Stripe is not yet configured',
        setupRequired: true,
        instructions: [
          '1. Create a new Stripe account for PROVENIQ Foundation at stripe.com',
          '2. Complete nonprofit verification for 501(c)(3) status',
          '3. Add STRIPE_SECRET_KEY to .env.local',
          '4. Add STRIPE_WEBHOOK_SECRET for webhook verification',
          '5. Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for client-side',
        ],
      });
    }

    // Dynamic import of Stripe to avoid build errors if not installed
    let Stripe;
    try {
      Stripe = (await import('stripe')).default;
    } catch (e) {
      return NextResponse.json({
        error: 'Stripe package not installed',
        setupRequired: true,
        instructions: ['Run: npm install stripe'],
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Build line item
    const lineItem: any = {
      price_data: {
        currency: 'usd',
        product_data: {
          name: isMonthly ? 'Monthly Donation to PROVENIQ Foundation' : 'Donation to PROVENIQ Foundation',
          description: dedication 
            ? `${dedication} - Supporting PetMayday animal rescue operations in West Virginia`
            : 'Supporting PetMayday animal rescue operations in West Virginia',
          images: ['https://petmayday.org/icon-pet-profiles.ico'],
        },
        unit_amount: amount * 100, // Stripe uses cents
        ...(isMonthly && { recurring: { interval: 'month' } }),
      },
      quantity: 1,
    };

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: isMonthly ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/donate`,
      customer_email: donorEmail,
      metadata: {
        donorName,
        dedication,
        isMonthly: isMonthly ? 'true' : 'false',
      },
      billing_address_collection: 'required',
      submit_type: isMonthly ? undefined : 'donate',
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
