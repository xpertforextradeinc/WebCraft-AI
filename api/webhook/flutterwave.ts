import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/utils/supabaseClient.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Capture Raw Body
    let rawBody = '';
    if ((req as any).rawBody) {
      rawBody = (req as any).rawBody.toString('utf8');
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (req.body && typeof req.body === 'object') {
      rawBody = JSON.stringify(req.body);
    } else {
      const buffers: Buffer[] = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      rawBody = Buffer.concat(buffers).toString('utf8');
    }

    // --- Feature 3: Cryptographic Secret Hash Header Check ---
    // Validate that the request signature header ('verif-hash') aligns perfectly with the secure secret hash configured on the dashboard and in environment variables.
    const flwSignature = req.headers['verif-hash'] as string;
    if (!flwSignature) {
      console.error("[SECURITY] Flutterwave verif-hash header is missing. Cryptographic signature check failed.");
      return res.status(401).json({ error: "Unauthorized signature payload verification failed. Missing verif-hash header." });
    }

    const localSecretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    if (!localSecretHash) {
      console.error("[SECURITY] FLUTTERWAVE_SECRET_HASH is not configured in environment variables.");
      return res.status(500).json({ error: "Cryptographic configuration error. Secret hash is not set." });
    }

    if (flwSignature !== localSecretHash) {
      console.error("[SECURITY] Flutterwave verif-hash mismatch. Unauthorized signature payload verification failed.");
      return res.status(401).json({ error: "Unauthorized signature payload verification failed." });
    }

    console.log("🔒 [SECURITY] Feature 3 Cryptographic Secret Hash Header Check passed successfully.");

    // Parse payload after validation
    const payload = JSON.parse(rawBody);

    // 3. Successful Payment Event Handler
    if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
      const data = payload.data;
      const customerEmail = data.customer?.email;
      
      // Extract user_id from metadata (could be flat inside meta or nested depending on API payload format)
      let targetUserId = data.meta?.user_id || data.meta?.userId;

      console.log("Flutterwave webhook charge.completed received:", {
        email: customerEmail,
        userId: targetUserId,
        id: data.id,
        txRef: data.tx_ref,
        amount: data.amount,
        currency: data.currency
      });

      let profile = null;

      // Try finding profile by user_id first
      if (targetUserId) {
        const { data: profileByUid, error: fetchErrByUid } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();
        
        if (!fetchErrByUid && profileByUid) {
          profile = profileByUid;
        }
      }

      // If not found, try finding profile by email
      if (!profile && customerEmail) {
        const { data: profileByEmail, error: fetchErrByEmail } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', customerEmail)
          .maybeSingle();

        if (!fetchErrByEmail && profileByEmail) {
          profile = profileByEmail;
          targetUserId = profileByEmail.id;
        }
      }

      // Determine credits to add based on the amount paid (to give robust dynamic credit grants)
      let creditsToAdd = 100;
      if (data.amount >= 240000) {
        creditsToAdd = 2000; // Yearly
      } else if (data.amount >= 24000) {
        creditsToAdd = 200;  // Monthly
      } else if (data.amount >= 12000) {
        creditsToAdd = 50;   // Weekly
      }

      // 4. Update or Insert DB profile with 'pro' plan tier and credits
      if (profile) {
        const currentCredits = profile.media_credits || 0;
        const { error: updateErr } = await supabase
          .from('user_profiles')
          .update({
            plan_tier: 'pro',
            media_credits: currentCredits + creditsToAdd
          })
          .eq('id', targetUserId);

        if (updateErr) {
          console.error("Error updating user profile in database via Flutterwave webhook:", updateErr);
          return res.status(500).json({ error: "Failed to update user profile" });
        }

        console.log(`Successfully provisioned Pro plan + ${creditsToAdd} credits to user: ${targetUserId} (${customerEmail})`);
      } else {
        if (targetUserId) {
          const { error: insertErr } = await supabase
            .from('user_profiles')
            .insert({
              id: targetUserId,
              email: customerEmail || null,
              plan_tier: 'pro',
              media_credits: creditsToAdd
            });

          if (insertErr) {
            console.error("Error creating user profile in database via Flutterwave webhook:", insertErr);
            return res.status(500).json({ error: "Failed to create user profile" });
          }

          console.log(`Successfully created and provisioned Pro plan + ${creditsToAdd} credits for user: ${targetUserId}`);
        } else {
          console.warn("Could not find or create profile - missing user ID and existing profile.");
          return res.status(404).json({ error: "User profile not found, and no User ID provided in payment metadata" });
        }
      }
    } else {
      console.log(`Ignored Flutterwave event or unsuccessful status: ${payload.event}, status: ${payload.data?.status}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Flutterwave webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
