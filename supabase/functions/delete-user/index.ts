/**
 * delete-user — Permanently deletes a user account and all associated data.
 *
 * Called by the frontend's useDeleteAccount hook when a user requests account deletion.
 * Requires a valid user JWT (verify_jwt = true in config.toml).
 *
 * Deletion order (respects FK constraints):
 *  1. conversation_messages (FK → conversations)
 *  2. conversations (FK → listings)
 *  3. matches (FK → listings)
 *  4. likes (FK → listings)
 *  5. listings (FK → profiles)
 *  6. tokens, user_subscriptions, push_subscriptions, notifications
 *  7. client_filter_preferences, saved_filters
 *  8. client_profiles, owner_profiles
 *  9. user_roles
 * 10. profiles
 * 11. Storage files (profile images, listing images)
 * 12. Auth user (via admin API)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // The JWT is verified by Supabase before reaching here (verify_jwt = true)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to identify them
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userToken = authHeader.replace("Bearer ", "");

    // User-scoped client to get the current user's ID
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Admin client for privileged operations (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Step 1: Delete conversation messages ---
    const { data: userConversations } = await adminClient
      .from("conversations")
      .select("id")
      .or(`client_id.eq.${userId},owner_id.eq.${userId}`);

    if (userConversations && userConversations.length > 0) {
      const convIds = userConversations.map((c: any) => c.id);
      await adminClient
        .from("conversation_messages")
        .delete()
        .in("conversation_id", convIds);
    }

    // --- Step 2: Delete conversations ---
    await adminClient
      .from("conversations")
      .delete()
      .or(`client_id.eq.${userId},owner_id.eq.${userId}`);

    // --- Step 3: Delete matches ---
    await adminClient
      .from("matches")
      .delete()
      .or(`user_id.eq.${userId},owner_id.eq.${userId}`);

    // --- Step 4: Delete likes ---
    await adminClient.from("likes").delete().eq("user_id", userId);

    // --- Step 5: Get listing IDs then delete listings ---
    const { data: userListings } = await adminClient
      .from("listings")
      .select("id")
      .eq("owner_id", userId);

    if (userListings && userListings.length > 0) {
      const listingIds = userListings.map((l: any) => l.id);

      // Delete listing images from storage
      const { data: imageFiles } = await adminClient.storage
        .from("listing-images")
        .list(userId);

      if (imageFiles && imageFiles.length > 0) {
        const filePaths = imageFiles.map((f: any) => `${userId}/${f.name}`);
        await adminClient.storage.from("listing-images").remove(filePaths);
      }

      await adminClient.from("listings").delete().in("id", listingIds);
    }

    // --- Step 6: Delete tokens, subscriptions, notifications, push subscriptions ---
    await Promise.all([
      adminClient.from("tokens").delete().eq("user_id", userId),
      adminClient.from("user_subscriptions").delete().eq("user_id", userId),
      adminClient.from("notifications").delete().eq("user_id", userId),
      adminClient.from("push_subscriptions").delete().eq("user_id", userId),
    ]);

    // --- Step 7: Delete preferences and filters ---
    await Promise.all([
      adminClient.from("client_filter_preferences").delete().eq("user_id", userId),
      adminClient.from("saved_filters").delete().eq("user_id", userId),
    ]);

    // --- Step 8: Delete specialized profiles ---
    await Promise.all([
      adminClient.from("client_profiles").delete().eq("user_id", userId),
      adminClient.from("owner_profiles").delete().eq("user_id", userId),
    ]);

    // --- Step 9: Delete user role ---
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // --- Step 10: Delete profile and profile image ---
    const { data: profile } = await adminClient
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.avatar_url) {
      // Extract file path from URL and delete from storage
      try {
        const url = new URL(profile.avatar_url);
        const pathParts = url.pathname.split("/avatars/");
        if (pathParts.length > 1) {
          await adminClient.storage.from("avatars").remove([pathParts[1]]);
        }
      } catch {
        // Non-critical: storage cleanup failure should not block account deletion
      }
    }

    await adminClient.from("profiles").delete().eq("user_id", userId);

    // --- Step 11: Delete auth user (must be last) ---
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("[delete-user] Failed to delete auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to delete auth account", details: deleteAuthError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[delete-user] Successfully deleted user ${userId}`);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[delete-user] Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
