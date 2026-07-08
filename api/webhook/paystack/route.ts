import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../src/utils/supabaseClient';
import crypto from 'crypto';

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

    // 2. Validate Paystack Signature
    const signature = req.headers['x-paystack-signature'] as string;
    if (!signature) {
      console.error("Paystack signature header is missing");
      return res.status(401).json({ error: "Missing signature header" });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.error("Paystack signature verification failed");
      return res.status(401).json({ error: "Unauthorized: Signature mismatch" });
    }

    // Parse payload after signature verification
    const payload = JSON.parse(rawBody);

    // 3. Successful Payment Logic Event
    if (payload.event === 'charge.success') {
      const data = payload.data;
      const customerEmail = data.customer?.email;
      // Extract user_id from metadata or fallback
      let targetUserId = data.metadata?.user_id;

      console.log("Paystack webhook charge.success received:", {
        email: customerEmail,
        userId: targetUserId,
        reference: data.reference,
        amount: data.amount
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

      // 4. Automated DB Balance Provisioning
      if (profile) {
        const currentCredits = profile.media_credits || 0;
        const { error: updateErr } = await supabase
          .from('user_profiles')
          .update({
            plan_tier: 'pro',
            media_credits: currentCredits + 100
          })
          .eq('id', targetUserId);

        if (updateErr) {
          console.error("Error updating user profile in database:", updateErr);
          return res.status(500).json({ error: "Failed to update user profile" });
        }

        console.log(`Successfully provisioned Pro plan + 100 credits to user: ${targetUserId} (${customerEmail})`);
      } else {
        // If profile doesn't exist, but we have user_id, let's create a new profile with the Pro plan and 100 credits
        if (targetUserId) {
          const { error: insertErr } = await supabase
            .from('user_profiles')
            .insert({
              id: targetUserId,
              email: customerEmail || null,
              plan_tier: 'pro',
              media_credits: 100
            });

          if (insertErr) {
            console.error("Error creating user profile in database:", insertErr);
            return res.status(500).json({ error: "Failed to create user profile" });
          }

          console.log(`Successfully created and provisioned Pro plan + 100 credits for user: ${targetUserId}`);
        } else {
          console.warn("Could not find or create profile - missing user ID and existing profile.");
          return res.status(404).json({ error: "User profile not found, and no User ID provided in payment metadata" });
        }
      }
    } else {
      console.log(`Ignored Paystack event: ${payload.event}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Paystack webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
