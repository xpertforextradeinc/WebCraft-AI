import { VercelRequest, VercelResponse } from '@vercel/node';

interface FlutterwavePlan {
  id: number;
  name: string;
  amount: number;
  interval: string;
  currency: string;
  plan_token: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  // If FLUTTERWAVE_SECRET_KEY is missing or looks like the template default, fail immediately
  if (!secretKey || secretKey.trim() === "" || secretKey === "CzsFdN1EZoFZo4eVSzOgZDcp58sU03kP") {
    console.warn("FLUTTERWAVE_SECRET_KEY is missing, empty, or uses the template placeholder value.");
    return res.status(401).json({
      success: false,
      error: "Payments temporarily unavailable. (Missing or invalid FLUTTERWAVE_SECRET_KEY configuration)"
    });
  }

  try {
    // 1. Fetch all existing payment plans to prevent duplicate plan creation
    const fetchResponse = await fetch('https://api.flutterwave.com/v3/payment-plans', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error("Failed to fetch existing Flutterwave plans from API:", errorText);
      
      return res.status(fetchResponse.status).json({
        success: false,
        error: "Payments temporarily unavailable. (Flutterwave API returned error status)"
      });
    }

    const listData = await fetchResponse.json();
    const existingPlans: FlutterwavePlan[] = listData.data || [];

    const plansToEnsure = [
      { name: "WebCraft AI Weekly", amount: 12000, interval: "weekly", currency: "NGN" },
      { name: "WebCraft AI Monthly", amount: 24000, interval: "monthly", currency: "NGN" },
      { name: "WebCraft AI Yearly", amount: 240000, interval: "yearly", currency: "NGN" },
    ];

    const results = [];

    // 2. Iterate and ensure each plan exists
    for (const planDef of plansToEnsure) {
      const matched = existingPlans.find(
        (p) => p.name.trim().toLowerCase() === planDef.name.trim().toLowerCase()
      );

      if (matched) {
        console.log(`Plan "${planDef.name}" already exists:`, matched);
        results.push({
          name: matched.name,
          id: matched.id,
          plan_token: matched.plan_token,
          amount: matched.amount,
          interval: matched.interval,
          currency: matched.currency,
          status: "reused",
        });
      } else {
        console.log(`Plan "${planDef.name}" does not exist. Creating...`);
        const createResponse = await fetch('https://api.flutterwave.com/v3/payment-plans', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: planDef.name,
            amount: planDef.amount,
            interval: planDef.interval,
            currency: planDef.currency,
          }),
        });

        if (!createResponse.ok) {
          const createError = await createResponse.text();
          console.error(`Failed to create Flutterwave plan "${planDef.name}" via API:`, createError);
          
          return res.status(createResponse.status).json({
            success: false,
            error: `Payments temporarily unavailable. (Failed to create standard subscription plan: ${planDef.name})`
          });
        }

        const createData = await createResponse.json();
        const created = createData.data;

        results.push({
          name: created.name,
          id: created.id,
          plan_token: created.plan_token,
          amount: created.amount,
          interval: created.interval,
          currency: created.currency,
          status: "created",
        });
      }
    }

    return res.status(200).json({
      success: true,
      plans: results,
      mode: "live"
    });
  } catch (err: any) {
    console.error("Error creating Flutterwave plans:", err);
    return res.status(500).json({
      success: false,
      error: `Payments temporarily unavailable. (Internal error: ${err.message || err})`
    });
  }
}
