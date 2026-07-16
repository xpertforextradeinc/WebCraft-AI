import { supabase } from './supabaseClient.js';

export interface UserProfile {
  id: string;
  email: string | null;
  plan_tier: string;
  media_credits: number;
  table_missing?: boolean;
}

/**
 * Checks if a user has sufficient credits and retrieves their profile.
 * Gracefully handles missing tables or missing profiles.
 */
export async function checkUserCredits(userId: string, email?: string): Promise<{ allowed: boolean; profile: UserProfile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, plan_tier, media_credits')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // Check if table is missing
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn("Supabase user_profiles table does not exist yet. Returning fallback profile.");
        return {
          allowed: true, // Allow generation when tables are not set up yet
          profile: {
            id: userId,
            email: email || null,
            plan_tier: 'free',
            media_credits: 5,
            table_missing: true
          }
        };
      }
      throw error;
    }

    if (!data) {
      // Profile table exists but user doesn't have a record yet, create one
      const defaultProfile: UserProfile = {
        id: userId,
        email: email || 'guest@example.com',
        plan_tier: 'free',
        media_credits: 5
      };

      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(defaultProfile);

      if (insertError) {
        console.warn("Could not auto-create user profile:", insertError);
        // Fallback to in-memory check
        return { allowed: true, profile: defaultProfile };
      }

      return { allowed: true, profile: defaultProfile };
    }

    const profile: UserProfile = data as UserProfile;
    
    // Pro plan users always have unlimited, free tiers check credits
    const isPro = profile.plan_tier === 'pro';
    const allowed = isPro || profile.media_credits > 0;

    return {
      allowed,
      profile,
      error: !allowed ? 'Insufficient media credits. Please upgrade your plan or purchase more credits.' : undefined
    };
  } catch (err: any) {
    console.error("Error checking credits:", err);
    // Graceful fallback to avoid breaking the layout canvas frame
    return {
      allowed: true,
      profile: {
        id: userId,
        email: email || null,
        plan_tier: 'free',
        media_credits: 5,
        table_missing: true
      }
    };
  }
}

/**
 * Decrements the media_credits balance by 1 for a specific user, if they are not a Pro user.
 */
export async function decrementUserCredits(userId: string): Promise<boolean> {
  try {
    // First, fetch current profile to verify plan_tier
    const { data: profile, error: fetchErr } = await supabase
      .from('user_profiles')
      .select('plan_tier, media_credits')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr || !profile) {
      return false;
    }

    if (profile.plan_tier === 'pro') {
      // Pro tier doesn't consume credits
      return true;
    }

    const newCredits = Math.max(0, (profile.media_credits || 0) - 1);
    const { error: updateErr } = await supabase
      .from('user_profiles')
      .update({ media_credits: newCredits })
      .eq('id', userId);

    if (updateErr) {
      console.error("Failed to decrement user credits:", updateErr);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in decrementUserCredits:", err);
    return false;
  }
}

/**
 * Gracefully logs generation events to the generations table.
 */
export async function logGenerationEvent(
  userId: string | null,
  type: 'layout' | 'image' | 'video' | 'refine',
  prompt: string,
  outputContent: string
): Promise<boolean> {
  try {
    // Ensure we have a valid uuid or fallback to null if no matching auth.users ID
    const validUserId = userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? userId : null;

    const { error } = await supabase
      .from('generations')
      .insert({
        user_id: validUserId,
        type,
        prompt,
        output_content: outputContent
      });

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn("Supabase 'generations' table does not exist yet. Log bypassed.");
      } else {
        console.warn("Skipping generation event logging due to error:", error.message);
      }
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error logging generation event:", err);
    return false;
  }
}
